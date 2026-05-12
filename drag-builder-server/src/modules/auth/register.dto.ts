import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '用户名只能包含字母、数字和下划线',
  })
  username?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不合法' })
  @MaxLength(255)
  email?: string;

  @IsString()
  @MinLength(8, { message: '密码长度至少 8 个字符' })
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @ValidateIf((o: RegisterDto) => !o.username && !o.email)
  private readonly _atLeastOne!: undefined;
}

export function validateAtLeastOneIdentify(dto: { username?: string; email?: string }): boolean {
  return !!(dto.username || dto.email);
}
