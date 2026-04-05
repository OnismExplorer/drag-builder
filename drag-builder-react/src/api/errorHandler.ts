/**
 * API 错误处理工具
 * 统一处理 HTTP 错误，根据错误类型显示不同的用户提示
 *
 * 安全原则：
 * - 系统异常（5xx）不暴露具体错误信息，统一显示"系统繁忙，请稍后重试"
 * - 业务错误（4xx）显示具体错误信息
 * - 网络错误显示"网络连接失败，请检查网络"
 */

import type { AxiosError } from 'axios';

/**
 * 系统异常错误消息（对外展示）
 */
const SYSTEM_ERROR_MESSAGE = '系统繁忙，请稍后重试';

/**
 * 网络错误消息
 */
const NETWORK_ERROR_MESSAGE = '网络连接失败，请检查网络';

/**
 * 超时错误消息
 */
const TIMEOUT_ERROR_MESSAGE = '请求超时，请稍后重试';

/**
 * 解析 API 错误消息
 * 根据 HTTP 状态码返回用户友好的错误消息
 *
 * @param error Axios 错误对象
 * @returns 错误消息（用于日志记录）和用户提示（用于 Toast 显示）
 */
export function parseApiError(error: unknown): {
  logMessage: string;
  userMessage: string;
  isSystemError: boolean;
} {
  // 默认返回值
  const defaultResult = {
    logMessage: '未知错误',
    userMessage: SYSTEM_ERROR_MESSAGE,
    isSystemError: true,
  };

  if (!error || typeof error !== 'object') {
    return defaultResult;
  }

  // 处理 Axios 错误
  if (isAxiosError(error)) {
    const { response, code, message } = error;

    // 有响应的情况（服务端返回了错误状态码）
    if (response) {
      const { status, data } = response;

      // 提取错误消息
      const errorMessage =
        extractErrorMessage(data) || (typeof data === 'string' ? data : null) || message;

      // 5xx 系统错误：不暴露具体信息
      if (status >= 500 && status < 600) {
        return {
          logMessage: `[HTTP ${status}] ${errorMessage || '服务端错误'}`,
          userMessage: SYSTEM_ERROR_MESSAGE,
          isSystemError: true,
        };
      }

      // 4xx 客户端错误：显示具体错误信息
      if (status >= 400 && status < 500) {
        // 特殊处理 401 未授权
        if (status === 401) {
          return {
            logMessage: `[HTTP ${status}] 未授权: ${errorMessage || '请重新登录'}`,
            userMessage: '登录已过期，请重新登录',
            isSystemError: false,
          };
        }

        // 403 禁止访问
        if (status === 403) {
          return {
            logMessage: `[HTTP ${status}] 禁止访问: ${errorMessage || '权限不足'}`,
            userMessage: '权限不足，无法执行此操作',
            isSystemError: false,
          };
        }

        // 404 未找到
        if (status === 404) {
          return {
            logMessage: `[HTTP ${status}] 资源不存在: ${errorMessage || ''}`,
            userMessage: errorMessage || '请求的资源不存在',
            isSystemError: false,
          };
        }

        // 其他 4xx 错误
        return {
          logMessage: `[HTTP ${status}] 客户端错误: ${errorMessage || ''}`,
          userMessage: errorMessage || `请求失败 (${status})`,
          isSystemError: false,
        };
      }
    }

    // 无响应的情况（网络错误）
    if (code === 'ECONNABORTED') {
      return {
        logMessage: `[请求超时] ${message}`,
        userMessage: TIMEOUT_ERROR_MESSAGE,
        isSystemError: true,
      };
    }

    if (code === 'ERR_NETWORK' || !error.response) {
      return {
        logMessage: `[网络错误] ${message}`,
        userMessage: NETWORK_ERROR_MESSAGE,
        isSystemError: true,
      };
    }

    // 其他未知错误
    return {
      logMessage: `[未知错误] code: ${code}, message: ${message}`,
      userMessage: SYSTEM_ERROR_MESSAGE,
      isSystemError: true,
    };
  }

  // 处理普通 Error 对象
  if (error instanceof Error) {
    return {
      logMessage: error.message,
      userMessage: SYSTEM_ERROR_MESSAGE,
      isSystemError: true,
    };
  }

  return defaultResult;
}

/**
 * 判断是否为 Axios 错误
 */
function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}

/**
 * 从响应数据中提取错误消息
 */
function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as Record<string, unknown>;

  // 优先从 message 字段提取
  if (typeof obj.message === 'string') {
    // 如果 message 是数组，取第一个元素
    if (Array.isArray(obj.message)) {
      return obj.message[0] as string;
    }
    return obj.message;
  }

  // 从 error 字段提取
  if (typeof obj.error === 'string') {
    return obj.error;
  }

  // 从 msg 字段提取（部分 API 使用）
  if (typeof obj.msg === 'string') {
    return obj.msg;
  }

  return null;
}

/**
 * 记录 API 错误日志
 * 在控制台输出结构化的错误信息
 *
 * @param context 错误上下文（如 '保存项目'、'加载列表'）
 * @param error 错误对象
 */
export function logApiError(context: string, error: unknown): void {
  const { logMessage, isSystemError } = parseApiError(error);

  if (isSystemError) {
    console.error(`[API Error - ${context}] 系统错误:`, logMessage, error);
  } else {
    console.warn(`[API Error - ${context}] 业务错误:`, logMessage, error);
  }
}
