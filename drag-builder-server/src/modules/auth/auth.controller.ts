import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  ConflictException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, validateAtLeastOneIdentify } from './register.dto';
import { LoginDto, validateLoginAtLeastOneIdentify } from './login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AuthResponse } from './auth.service';

interface RequestWithUser extends Request {
  user: { userId: string; username: string | null };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
