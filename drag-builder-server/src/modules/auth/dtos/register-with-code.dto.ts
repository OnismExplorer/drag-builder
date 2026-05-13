import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterWithCodeDto {
  @IsEmail({}, { message: '邮箱格式不合法' })
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(6, { message: '验证码为 6 位数字' })
  @MaxLength(6)
  @Matches(/^\d{6}$/, { message: '验证码必须为 6 位数字' })
  code!: string;

  @IsString()
  @MinLength(8, { message: '密码长度至少 8 个字符' })
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;
}
