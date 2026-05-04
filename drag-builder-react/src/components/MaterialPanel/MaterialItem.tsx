/**
 * MaterialItem 组件
 * 物料库中的单个组件项，支持拖拽到画布
 *
 * 功能：
 * - 默认显示图标（Logo）
 * - 悬浮时展开显示 label 和 description
 * - 使用绝对定位避免挤压其他组件
 * - 文字从下往上滚动淡入效果
 * - 触发浮层预览
 * - 支持 lucide 和 @ant-design/icons 两种图标源
 */

import React, { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import type { MaterialConfig } from '@store/componentRegistry';
import { getAntdIconSync, isAntdIcon } from '@components/adapters/antd/shared/iconMap';
import GlareHover from './GlareHover';

interface MaterialItemProps {
  config: MaterialConfig;
  onHoverChange?: (config: MaterialConfig | null, element?: HTMLElement | null) => void;
}

/**
 * 根据组件类型返回对应的 SVG 图标
 */
const getComponentIcon = (type: string) => {
  switch (type) {
    case 'div':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'button':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect
            x="3"
            y="8"
            width="18"
            height="8"
            rx="2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'text':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M4 7V4h16v3M9 20h6M12 4v16"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'image':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
          <path d="M21 15l-5-5L5 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'input':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect
            x="3"
            y="8"
            width="18"
            height="8"
            rx="2"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M7 10v4" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'radio':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="8" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case 'checkbox':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
          <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'tag':
      return (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
            strokeWidth="2"
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
 * MaterialItem 组件
 * 默认显示图标，悬浮时展开显示详细信息
 */
/**
 * 获取组件图标（支持 antd 图标和内置 SVG fallback）
 */
const getIconNode = (config: MaterialConfig): React.ReactNode => {
  // 优先使用 antd 图标
  if (config.iconSource === 'antd' && isAntdIcon(config.icon)) {
    const IconComponent = getAntdIconSync(config.icon);
    if (IconComponent) {
      return <IconComponent style={{ fontSize: 20 }} />;
    }
  }
  // Fallback 到内置 SVG 图标
  return getComponentIcon(config.type);
};

export const MaterialItem: React.FC<MaterialItemProps> = ({ config, onHoverChange }) => {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `material-${config.type}`,
    data: {
      type: config.type,
      isMaterial: true,
    },
  });

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(config, containerRef.current);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange?.(null, null);
  };

  return (
    <div
      ref={node => {
        setNodeRef(node);
        if (node) {
          (containerRef as React.RefObject<HTMLDivElement>).current = node;
        }
      }}
      {...listeners}
      {...attributes}
      className="relative select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        transition: 'opacity 0.2s, transform 0.2s',
      }}
    >
      <div className="relative w-full">
        <GlareHover
          width="100%"
          height="auto"
          background={config.backgroundColor || 'white'}
          borderRadius="12px"
          borderColor="#e2e8f0"
          glareColor="#ffffff"
          glareOpacity={0.6}
          glareAngle={-45}
          glareSize={200}
          transitionDuration={500}
          className="transition-all duration-200"
          style={{
            boxShadow:
              '0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06), inset 0 -1px 0 rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            className="grid items-center p-2 w-full overflow-hidden"
            style={{ gridTemplateColumns: '1fr auto 1fr' }}
          >
            {/* 左侧占位 —— 保持三列结构平衡 */}
            <div className="min-w-0" />

            {/* 组件图标 —— 始终固定在中列，位置不受 hover 影响 */}
            <div
              className="
                flex items-center justify-center
                w-12 h-12
                rounded-lg
                text-slate-600
                border border-slate-200/80
              "
              style={{
                backgroundColor: config.backgroundColor || '#f8fafc',
                backgroundImage:
                  'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 100%)',
                boxShadow: `
                  inset 3px 3px 6px rgba(0, 0, 0, 0.06),
                  inset -3px -3px 6px rgba(255, 255, 255, 0.8),
                  inset 0 0 2px rgba(0, 0, 0, 0.03)
                `,
              }}
            >
              {getIconNode(config)}
            </div>

            {/* 文字信息 —— 悬浮时从右侧淡入，不参与布局流变化 */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  className="min-w-0 overflow-hidden"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{
                    duration: 0.2,
                    ease: 'easeOut',
                  }}
                >
                  <p className="text-sm font-medium text-slate-900 truncate">{config.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{config.description}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </GlareHover>
      </div>
    </div>
  );
};
