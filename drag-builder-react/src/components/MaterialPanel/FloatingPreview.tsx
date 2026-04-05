/**
 * FloatingPreview 组件
 * 浮层预览效果，显示组件的大尺寸图标和名称
 *
 * 功能：
 * - 在面板右侧弹出浮动卡片
 * - 覆盖在画布上方
 * - 显示中等尺寸图标和组件名称
 * - 文字从下往上滑入淡入效果
 * - 浮层从左向右位移和透明度变化
 * - 与组件位置水平对齐
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MaterialConfig } from '../../store/componentRegistry';

interface FloatingPreviewProps {
  config: MaterialConfig | null;
  isVisible: boolean;
  triggerElement?: HTMLElement | null;
}

/**
 * 根据组件类型返回对应的中等尺寸 SVG 图标
 */
const getMediumComponentIcon = (type: string) => {
  const iconProps = {
    className: 'w-16 h-16',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.5',
  };

  switch (type) {
    case 'div':
      return (
        <svg {...iconProps}>
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'button':
      return (
        <svg {...iconProps}>
          <rect
            x="3"
            y="8"
            width="18"
            height="8"
            rx="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'text':
      return (
        <svg {...iconProps}>
          <path d="M4 7V4h16v3M9 20h6M12 4v16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'image':
      return (
        <svg {...iconProps}>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'input':
      return (
        <svg {...iconProps}>
          <rect
            x="3"
            y="8"
            width="18"
            height="8"
            rx="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M7 10v4" strokeLinecap="round" />
        </svg>
      );
    case 'radio':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case 'checkbox':
      return (
        <svg {...iconProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'tag':
      return (
        <svg {...iconProps}>
          <path
            d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="7" r="1.5" fill="currentColor" />
        </svg>
      );
    default:
      return null;
  }
};

/**
 * FloatingPreview 组件
 * 在面板右侧显示浮动预览卡片，与触发元素水平对齐
 */
export const FloatingPreview: React.FC<FloatingPreviewProps> = ({
  config,
  isVisible,
  triggerElement,
}) => {
  // 计算浮层的垂直位置，使其与触发元素对齐
  const topPosition = React.useMemo(() => {
    if (triggerElement && isVisible) {
      const rect = triggerElement.getBoundingClientRect();
      // 计算触发元素的中心位置
      const elementCenter = rect.top + rect.height / 2;
      // 浮层高度约为 200px，使其中心与触发元素中心对齐
      const floatingHeight = 200;
      return elementCenter - floatingHeight / 2;
    }
    return 0;
  }, [triggerElement, isVisible]);

  if (!config) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{
            duration: 0.2,
            ease: 'easeOut',
          }}
          className="
            fixed left-[280px]
            w-48 p-4
            bg-white/95 backdrop-blur-xl
            border border-slate-200
            rounded-xl
            shadow-2xl
            pointer-events-none
            z-50
          "
          style={{
            top: `${topPosition}px`,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* 图标容器 */}
          <div className="flex items-center justify-center mb-3">
            <div
              className="
                flex items-center justify-center
                w-16 h-16
                rounded-xl
                text-slate-600
                bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100
                border border-slate-200/80
              "
              style={{
                backgroundColor: config.backgroundColor,
                boxShadow: `
                  inset 3px 3px 6px rgba(0, 0, 0, 0.1),
                  inset -3px -3px 6px rgba(255, 255, 255, 0.9),
                  inset 0 0 2px rgba(0, 0, 0, 0.05)
                `,
              }}
            >
              {getMediumComponentIcon(config.type)}
            </div>
          </div>

          {/* 组件名称 - 从下往上滑入淡入效果 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: 0.1,
              ease: 'easeOut',
            }}
            className="text-center"
          >
            <h3 className="text-base font-semibold text-slate-900 mb-1">{config.label}</h3>
            <p className="text-xs text-slate-500">{config.description}</p>
          </motion.div>

          {/* 装饰性渐变边框 */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${config.starColor}20 0%, transparent 50%)`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
