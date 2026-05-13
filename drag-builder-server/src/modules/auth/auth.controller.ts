import {
  Controller,
  Post,
  Get,
  Body,
  Ip,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ConflictException,
  TooManyRequestsException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { EmailCodeService } from './email-code.service';
import { GithubService } from './github.service';
import { RegisterDto, validateAtLeastOneIdentify } from './register.dto';
import { LoginDto, validateLoginAtLeastOneIdentify } from './login.dto';
import { SendCodeDto } from './dtos/send-code.dto';
import { RegisterWithCodeDto } from './dtos/register-with-code.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthResponse } from './auth.service';

interface RequestWithUser extends Request {
  user: { userId: string; username: string | null };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailCodeService: EmailCodeService,
    private readonly githubService: GithubService
  ) {}

  @Post('email/send-code')
  @HttpCode(HttpStatus.OK)
  async sendCode(@Body() dto: SendCodeDto, @Ip() ip: string) {
    const canSend = await this.emailCodeService.canSendFromIp(ip);
    if (!canSend) {
      throw new TooManyRequestsException('发送次数超限，请明天再试');
    }

    const turnstileValid = await this.emailCodeService.verifyTurnstile(dto.turnstileToken);
    if (!turnstileValid) {
      throw new UnprocessableEntityException('人机验证失败，请重试');
    }

    await this.emailCodeService.generateAndStoreCode(dto.email, ip);
    return { success: true };
  }

  @Post('email/register-with-code')
  @HttpCode(HttpStatus.CREATED)
  async registerWithCode(@Body() dto: RegisterWithCodeDto) {
    const isValid = await this.emailCodeService.verifyCode(dto.email, dto.code);
    if (!isValid) {
      throw new ConflictException('验证码错误或已过期');
    }

    return this.authService.registerWithEmailCode(dto);
  }

  @Get('github')
  @HttpCode(HttpStatus.FOUND)
  githubLogin() {
    const state = this.githubService.generateState();
    const url = this.githubService.getAuthorizationUrl(state);
    return { url };
  }

  @Post('github/exchange')
  @HttpCode(HttpStatus.OK)
  async githubExchange(@Body() body: { code: string }) {
    const user = await this.authService.handleGithubCallback(body.code);
    const payload: { sub: string; username: string | null } = {
      sub: user.id,
      username: user.username,
    };
    const accessToken = this.authService.generateAccessToken(payload);
    return { accessToken, user };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto
  ): Promise<Omit<import('./user.entity').UserEntity, 'passwordHash'>> {
    if (!validateAtLeastOneIdentify(dto)) {
      throw new ConflictException('至少提供用户名或邮箱');
    }
    return await this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    if (!validateLoginAtLeastOneIdentify(dto)) {
      throw new ConflictException('至少提供用户名或邮箱');
    }
    return await this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Req() req: RequestWithUser
  ): Promise<Omit<import('./user.entity').UserEntity, 'passwordHash'>> {
    return await this.authService.getProfile(req.user.userId);
  }
}
