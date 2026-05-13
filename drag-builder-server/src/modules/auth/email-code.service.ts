import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface EmailCodeData {
  code: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
  lockedUntil?: number;
}

export interface IpRateLimitData {
  count: number;
  resetAt: number;
}

@Injectable()
export class EmailCodeService {
  private readonly logger = new Logger(EmailCodeService.name);
  private readonly codeStore = new Map<string, EmailCodeData>();
  private readonly ipStore = new Map<string, IpRateLimitData>();

  private readonly CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 分钟
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCK_DURATION_MS = 30 * 60 * 1000; // 30 分钟
  private readonly MAX_IP_DAILY = 10;

  constructor(private readonly httpService: HttpService) {}

  async verifyTurnstile(token: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      this.logger.warn('TURNSTILE_SECRET_KEY 未配置，跳过人机验证');
      return true;
    }

    try {
      const response = await this.httpService.axiosRef.post(
        TURNSTILE_VERIFY_URL,
        new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
        { timeout: 5000 }
      );
      return response.data.success === true;
    } catch (error) {
      this.logger.error(`Turnstile 验证失败: ${String(error)}`);
      return false;
    }
  }

  async canSendFromIp(ip: string): Promise<boolean> {
    await Promise.resolve();
    this.cleanupIpStore();
    const data = this.ipStore.get(ip);
    if (!data) return true;
    if (Date.now() > data.resetAt) {
      this.ipStore.delete(ip);
      return true;
    }
    return data.count < this.MAX_IP_DAILY;
  }

  async generateAndStoreCode(email: string, ip: string): Promise<void> {
    await Promise.resolve();
    this.cleanupCodeStore();

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const ipData = this.ipStore.get(ip) || { count: 0, resetAt: midnight.getTime() };
    ipData.count += 1;
    this.ipStore.set(ip, ipData);

    this.codeStore.set(email, {
      code,
      attempts: 0,
      createdAt: now,
      expiresAt: now + this.CODE_EXPIRY_MS,
    });

    this.logger.log(`验证码已生成 for ${email}, IP: ${ip}`);
    this.logger.warn(`[模拟邮件] 验证码: ${code} -> ${email}`);
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    await Promise.resolve();
    this.cleanupCodeStore();

    const data = this.codeStore.get(email);
    if (!data) return false;

    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      this.logger.warn(`邮箱 ${email} 已被锁定`);
      return false;
    }

    if (Date.now() > data.expiresAt) {
      this.logger.warn(`验证码已过期 for ${email}`);
      return false;
    }

    data.attempts += 1;

    if (data.attempts >= this.MAX_ATTEMPTS) {
      data.lockedUntil = Date.now() + this.LOCK_DURATION_MS;
      this.logger.warn(`邮箱 ${email} 验证失败次数过多，已锁定`);
      this.codeStore.set(email, data);
      return false;
    }

    if (data.code !== code) {
      this.codeStore.set(email, data);
      return false;
    }

    this.codeStore.delete(email);
    return true;
  }

  private cleanupCodeStore(): void {
    const now = Date.now();
    for (const [email, data] of this.codeStore.entries()) {
      if (data.expiresAt < now || (data.lockedUntil && data.lockedUntil < now)) {
        this.codeStore.delete(email);
      }
    }
  }

  private cleanupIpStore(): void {
    const now = Date.now();
    for (const [ip, data] of this.ipStore.entries()) {
      if (data.resetAt < now) {
        this.ipStore.delete(ip);
      }
    }
  }
}
