/**
 * Modal 基础组件
 * 提供通用的模态框功能，支持动画和遮罩层交互
 *
 * 需求：1.2, 13. UI 视觉规范
 * - 1.2: 弹出画布规格选择模态框
 * - 13: 使用 Linear/Vercel 风格（rounded-2xl, shadow-sm）
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modal 组件属性接口
 */
interface ModalProps {
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭模态框的回调函数 */
  onClose: () => void;
  /** 模态框内容 */
  children: React.ReactNode;
  /** 模态框标题（可选） */
  title?: string;
  /** 模态框尺寸（可选，默认 medium） */
  size?: 'small' | 'medium' | 'large';
}

/**
 * 尺寸映射
 * 定义不同尺寸模态框的最大宽度
 */
const SIZE_MAP = {
  small: 'max-w-md', // 448px
  medium: 'max-w-lg', // 512px
  large: 'max-w-2xl', // 672px
};

/**
 * Modal 基础组件
 *
 * 特性：
 * - 使用 Framer Motion 实现打开/关闭动画
 * - 点击遮罩层关闭模态框
 * - 使用 Linear/Vercel 风格（rounded-2xl, shadow-sm）
 * - 支持 ESC 键关闭
 * - 自动锁定背景滚动
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'medium',
}) => {
  /**
   * 处理 ESC 键关闭
   */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  /**
   * 锁定背景滚动
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  /**
   * 处理遮罩层点击
   * 只有点击遮罩层本身才关闭，点击内容区域不关闭
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* 遮罩层动画 */}
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* 模态框内容动画 */}
          <motion.div
            className={`relative bg-white rounded-2xl shadow-sm ${SIZE_MAP[size]} w-full`}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* 标题栏（可选） */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 tracking-tight">{title}</h2>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="关闭"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* 内容区域 */}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
