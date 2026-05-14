import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserEntity } from './user.entity';
import { RegisterDto, validateAtLeastOneIdentify } from './register.dto';
import { LoginDto, validateLoginAtLeastOneIdentify } from './login.dto';
import { RegisterWithCodeDto } from './dtos/register-with-code.dto';
import { GithubService } from './github.service';

export interface JwtPayload {
  sub: string;
  username: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: Omit<UserEntity, 'passwordHash'>;
}

function stripPasswordHash(entity: UserEntity): Omit<UserEntity, 'passwordHash'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...rest } = entity;
  return rest;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly githubService: GithubService
  ) {}

  async register(dto: RegisterDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    if (!validateAtLeastOneIdentify(dto)) {
      throw new ConflictException('至少提供用户名或邮箱');
    }

    if (dto.username) {
      const existing = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existing) {
        throw new ConflictException('用户名已被占用');
      }
    }

    if (dto.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) {
        throw new ConflictException('邮箱已被注册');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      username: dto.username ?? null,
      email: dto.email ?? null,
      passwordHash,
      displayName: dto.displayName ?? dto.username ?? dto.email ?? null,
    });

    const saved = await this.userRepository.save(user);
    this.logger.log(`用户注册成功，ID：${saved.id}`);

    return stripPasswordHash(saved);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    if (!validateLoginAtLeastOneIdentify(dto)) {
      throw new ConflictException('至少提供用户名或邮箱');
    }

    let user: UserEntity | null = null;

    if (dto.username) {
      user = await this.userRepository.findOne({
        where: { username: dto.username },
      });
    } else if (dto.email) {
      user = await this.userRepository.findOne({
        where: { email: dto.email },
      });
    }

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload: JwtPayload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`用户登录成功，ID：${user.id}`);

    return { accessToken, user: stripPasswordHash(user) };
  }

  async getProfile(userId: string): Promise<Omit<UserEntity, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return stripPasswordHash(user);
  }

  async registerWithEmailCode(dto: RegisterWithCodeDto): Promise<Omit<UserEntity, 'passwordHash'>> {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('该邮箱已被注册');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = this.userRepository.create({
      username: dto.username ?? null,
      email: dto.email,
      passwordHash,
      displayName: dto.displayName ?? dto.username ?? dto.email ?? null,
    });

    const saved = await this.userRepository.save(user);
    this.logger.log(`邮箱验证码注册成功，ID：${saved.id}`);
    return stripPasswordHash(saved);
  }

  async handleGithubCallback(code: string): Promise<Omit<UserEntity, 'passwordHash'>> {
    const accessToken = await this.githubService.exchangeCodeForToken(code);
    const githubUser = await this.githubService.getUserInfo(accessToken);

    // 1. 通过 githubId 查找
    let user = await this.userRepository.findOne({ where: { githubId: String(githubUser.id) } });
    if (user) {
      let needSave = false;
      if (!user.username) {
        user.username = await this.resolveUniqueUsername(githubUser.login);
        needSave = true;
      }
      if (!user.email && githubUser.email) {
        user.email = githubUser.email;
        needSave = true;
      }
      if (needSave) {
        await this.userRepository.save(user);
      }
      this.logger.log(`GitHub 用户登录，ID：${user.id}`);
      return stripPasswordHash(user);
    }

    // 2. 通过 email 查找
    if (githubUser.email) {
      user = await this.userRepository.findOne({ where: { email: githubUser.email } });
      if (user) {
        user.githubId = String(githubUser.id);
        if (!user.username) {
          user.username = await this.resolveUniqueUsername(githubUser.login);
        }
        await this.userRepository.save(user);
        this.logger.log(`GitHub 用户绑定已有账号，ID：${user.id}`);
        return stripPasswordHash(user);
      }
    }

    // 3. 创建新用户
    const salt = await bcrypt.genSalt(10);
    const randomPassword =
      Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    const username = await this.resolveUniqueUsername(githubUser.login);

    const newUser = this.userRepository.create({
      username,
      email: githubUser.email,
      githubId: String(githubUser.id),
      passwordHash,
      displayName: githubUser.name || githubUser.login,
    });

    const saved = await this.userRepository.save(newUser);
    this.logger.log(`GitHub 新用户创建，ID：${saved.id}`);
    return stripPasswordHash(saved);
  }

  private async resolveUniqueUsername(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (await this.userRepository.findOne({ where: { username: candidate } })) {
      suffix++;
      candidate = `${base}${suffix - 1}`;
    }
    return candidate;
  }

  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }
}
