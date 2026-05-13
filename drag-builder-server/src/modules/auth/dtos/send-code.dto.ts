import { IsEmail, IsString, MaxLength } from 'class-validator';

export class SendCodeDto {
  @IsEmail({}, { message: '邮箱格式不合法' })
  @MaxLength(255)
  email!: string;

  @IsString()
  turnstileToken!: string;
}
