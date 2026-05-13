import apiClient from './client';
import type { UserInfo } from '@/store/authStore';

export interface RegisterPayload {
  username?: string;
  email?: string;
  password: string;
  displayName?: string;
}

export interface LoginPayload {
  username?: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserInfo;
}

export async function register(payload: RegisterPayload): Promise<UserInfo> {
  const response = await apiClient.post<UserInfo>('/auth/register', payload);
  return response.data;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload);
  return response.data;
}

export async function getProfile(): Promise<UserInfo> {
  const response = await apiClient.get<UserInfo>('/auth/profile');
  return response.data;
}

export async function githubExchange(code: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/github/exchange', { code });
  return response.data;
}
