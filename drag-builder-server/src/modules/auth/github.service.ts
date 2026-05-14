import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

export interface GithubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

export interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly githubAuthorizeUrl = 'https://github.com/login/oauth/authorize';
  private readonly githubTokenUrl = 'https://github.com/login/oauth/access_token';
  private readonly githubApiUrl = 'https://api.github.com';
  private readonly timeout = 30000; // 30 秒超时

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  getAuthorizationUrl(state: string): string {
    const config = this.configService.get('github');
    if (!config) {
      throw new Error('GitHub OAuth 未配置');
    }
    const { clientId, callbackUrl } = config;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: 'read:user,user:email',
      state,
    });

    return `${this.githubAuthorizeUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    const config = this.configService.get('github');
    if (!config) {
      throw new Error('GitHub OAuth 未配置');
    }
    const { clientId, clientSecret, callbackUrl } = config;

    const response = await this.httpService.axiosRef.post(
      this.githubTokenUrl,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
      { headers: { Accept: 'application/json' }, timeout: this.timeout }
    );

    if (response.data.error) {
      throw new Error(`GitHub OAuth 错误: ${response.data.error_description}`);
    }

    return response.data.access_token as string;
  }

  async getUserInfo(accessToken: string): Promise<GithubUser> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    };

    const userResponse = await this.httpService.axiosRef.get(`${this.githubApiUrl}/user`, {
      headers,
      timeout: this.timeout,
    });

    const user: GithubUser = userResponse.data;

    if (!user.email) {
      try {
        const emailsResponse = await this.httpService.axiosRef.get(
          `${this.githubApiUrl}/user/emails`,
          {
            headers,
            timeout: this.timeout,
          }
        );

        const emails: GithubEmail[] = emailsResponse.data;
        const primaryEmail =
          emails.find(e => e.primary && e.verified) || emails.find(e => e.verified);
        if (primaryEmail) {
          user.email = primaryEmail.email;
        }
      } catch (error) {
        this.logger.warn(`获取 GitHub 用户邮箱失败: ${String(error)}`);
      }
    }

    return user;
  }

  generateState(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}
