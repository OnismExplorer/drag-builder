/**
 * Axios HTTP 客户端实例
 * 统一配置请求基础参数、拦截器和错误处理
 *
 * 需求：10.2, 14.6, 15.1
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { parseApiError } from './errorHandler';

const TOKEN_KEY = 'drag_builder_token';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('drag_builder_user');
  } catch {
    // ignore
  }
}

/**
 * API 错误类
 * 携带用户友好的错误信息，便于调用方处理
 */
export class ApiError extends Error {
  userMessage: string;
  status?: number;
  isSystemError: boolean;

  constructor(
    message: string,
    userMessage: string,
    status?: number,
    isSystemError: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
    this.userMessage = userMessage;
    this.status = status;
    this.isSystemError = isSystemError;
  }
}

/**
 * 创建 Axios 实例
 * - baseURL: 后端服务地址
 * - timeout: 请求超时时间 5000ms（需求 14.6）
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * 请求拦截器
 * 在每次请求发出前统一添加请求头
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    // 请求配置错误，直接拒绝
    console.error(`[API] 请求配置错误：${error.message}`, error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 统一处理响应数据和错误（需求 15.1）
 * - 成功响应：直接返回 response
 * - 错误响应：记录日志，通过 Toast 显示用户友好的错误信息
 *
 * 注意：本拦截器只负责记录日志和显示 Toast，
 * 实际错误仍会 reject 传递给调用方，由调用方决定是否处理
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const timestamp = new Date().toISOString();

    if (error.response?.status === 401) {
      clearStoredToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const { logMessage, userMessage, isSystemError } = parseApiError(error);

    // 记录结构化日志
    if (isSystemError) {
      console.error(`[API Error - ${timestamp}]`, logMessage, error);
    } else {
      console.warn(`[API Error - ${timestamp}]`, logMessage, error);
    }

    // 获取状态码（如果有）
    const status = error.response?.status;

    // 创建 ApiError 携带用户友好的错误信息
    const apiError = new ApiError(logMessage, userMessage, status, isSystemError);

    // 注意：这里 reject 的是 ApiError，调用方可以 catch 并访问 apiError.userMessage
    // 但即使调用方不 catch，Toast 也已经在上面显示给用户了
    return Promise.reject(apiError);
  }
);

export default apiClient;
