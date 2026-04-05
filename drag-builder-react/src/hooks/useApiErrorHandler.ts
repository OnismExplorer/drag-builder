/**
 * 全局 API 错误处理 Hook
 * 在应用启动时调用，统一处理所有未捕获的 API 错误并显示 Toast
 *
 * 使用方式：
 * 1. 在 App.tsx 中调用 const handleApiError = useApiErrorHandler()
 * 2. 或者创建一个 ApiErrorProvider 组件
 *
 * 注意：这个 hook 会监听 unhandledrejection 事件，
 * 因此应该在应用根组件初始化时调用，且只调用一次
 */

import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/uiStore';
import { ApiError } from '../api/client';

/**
 * 全局 API 错误处理器
 * 监听未处理的 Promise  rejection，显示 Toast 提示
 */
export function useApiErrorHandler(): void {
  const showToast = useUIStore(state => state.showToast);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // 防止重复初始化
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    /**
     * 处理未捕获的 API 错误
     */
    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const reason = event.reason;

      // 检查是否是 ApiError
      if (reason instanceof ApiError) {
        // 显示 Toast（系统错误不暴露详情）
        showToast(reason.userMessage, 'error');

        // 防止浏览器默认行为（输出到控制台）
        event.preventDefault();
        return;
      }

      // 检查是否是 Axios 错误（未被拦截器处理的）
      if (reason && typeof reason === 'object' && 'isAxiosError' in reason) {
        // 对于其他 Axios 错误，显示通用消息
        showToast('系统繁忙，请稍后重试', 'error');
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [showToast]);
}
