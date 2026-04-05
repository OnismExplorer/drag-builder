/**
 * Toast 提示组件
 *
 * 功能：
 * - 支持多种显示位置（右上、中上、左上、右下、中下、左下）
 * - 支持五种类型：success（绿色）、error（红色）、info（蓝色）、warning（黄色）、waiting（灰色）
 * - 自动在 3 秒后消失
 * - 使用 Framer Motion 实现进入/退出动画
 * - 底部进度条倒计时效果
 *
 * 需求：15.1, 15.2, 15.6
 * - 15.1: 后端 API 返回错误时显示 Toast 错误提示
 * - 15.2: Toast 自动在 3 秒后消失
 * - 15.6: 项目保存成功显示绿色成功 Toast
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';

/**
 * 根据位置获取对应的 CSS 类名
 */
const getPositionClasses = (position: string = 'top-right') => {
  switch (position) {
    case 'top-right':
      return 'top-6 right-6';
    case 'top-center':
      return 'top-6 left-1/2 -translate-x-1/2';
    case 'top-left':
      return 'top-6 left-6';
    case 'bottom-right':
      return 'bottom-6 right-6';
    case 'bottom-center':
      return 'bottom-6 left-1/2 -translate-x-1/2';
    case 'bottom-left':
      return 'bottom-6 left-6';
    default:
      return 'top-6 right-6';
  }
};

/**
 * 根据位置获取动画配置
 */
const getAnimationConfig = (position: string = 'top-right') => {
  const isTop = position.startsWith('top');
  const isBottom = position.startsWith('bottom');
  const isLeft = position.includes('left');
  const isRight = position.includes('right');
  const isCenter = position.includes('center');

  let x = 0;
  let y = 0;

  if (isLeft) x = -100;
  if (isRight) x = 100;
  if (isCenter) x = 0;
  if (isTop) y = -20;
  if (isBottom) y = 20;

  return { x, y };
};

/**
 * Toast 组件样式配置
 * 根据类型返回对应的颜色和图标
 */
const getToastStyles = (type: 'success' | 'error' | 'info' | 'warning' | 'waiting') => {
  switch (type) {
    case 'success':
      return {
        iconColor: 'text-green-500',
        progressColor: 'bg-green-500',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        ),
      };
    case 'error':
      return {
        iconColor: 'text-red-500',
        progressColor: 'bg-red-500',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        ),
      };
    case 'info':
      return {
        iconColor: 'text-blue-500',
        progressColor: 'bg-blue-500',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        ),
      };
    case 'warning':
      return {
        iconColor: 'text-yellow-500',
        progressColor: 'bg-yellow-500',
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ),
      };
    case 'waiting':
      return {
        iconColor: 'text-gray-500',
        progressColor: 'bg-gray-500',
        icon: (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        ),
      };
  }
};

/**
 * Toast 组件
 *
 * 使用 Zustand Store 管理显示状态
 * 使用 Framer Motion 实现流畅的进入/退出动画
 */
export const Toast: React.FC = () => {
  const { toast, hideToast } = useUIStore();

  /**
   * 自动隐藏 Toast
   * 在 Toast 显示 3 秒后自动调用 hideToast
   */
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000); // 3 秒后自动消失

      // 清理定时器
      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          // 初始状态：根据位置从外部进入
          initial={{ opacity: 0, ...getAnimationConfig(toast.position) }}
          // 动画目标状态：完全显示
          animate={{ opacity: 1, x: toast.position?.includes('center') ? '-50%' : 0, y: 0 }}
          // 退出状态：根据位置向外部退出
          exit={{ opacity: 0, ...getAnimationConfig(toast.position) }}
          // 动画配置
          transition={{
            duration: 0.3,
            ease: 'easeOut',
          }}
          // 根据位置设置固定位置
          className={`fixed ${getPositionClasses(toast.position)} z-50`}
          key={toast.timestamp}
        >
          <div
            className="
              bg-gray-900/70 backdrop-blur-md
              text-white
              rounded-lg shadow-2xl
              min-w-[320px] max-w-[500px]
              overflow-hidden
              relative
              border border-gray-700/30
            "
          >
            {/* 主内容区域 */}
            <div className="px-4 py-3 flex items-center gap-3">
              {/* 图标 */}
              <div className={`flex-shrink-0 ${getToastStyles(toast.type).iconColor}`}>
                {getToastStyles(toast.type).icon}
              </div>

              {/* 消息文本 */}
              <p className="text-sm font-medium flex-1 text-gray-100">{toast.message}</p>

              {/* 关闭按钮 */}
              <button
                onClick={hideToast}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
                aria-label="关闭提示"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 底部进度条 */}
            <div className="h-1 bg-gray-800 relative overflow-hidden">
              <motion.div
                className={`h-full ${getToastStyles(toast.type).progressColor}`}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{
                  duration: 3,
                  ease: 'linear',
                }}
                key={`progress-${toast.timestamp}`}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
