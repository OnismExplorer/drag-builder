import { IsString, IsOptional, MinLength, IsEmail, MaxLength } from 'class-validator';
import { validateAtLeastOneIdentify } from './register.dto';

export class LoginDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不合法' })
  @MaxLength(255)
  email?: string;

  @IsString()
  @MinLength(1, { message: '密码不能为空' })
  password!: string;
}

export function validateLoginAtLeastOneIdentify(dto: LoginDto): boolean {
  return validateAtLeastOneIdentify(dto);
}
