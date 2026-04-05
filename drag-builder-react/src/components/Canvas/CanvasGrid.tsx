/**
 * CanvasGrid 组件
 * 绘制画布网格背景，提供视觉参考
 *
 * 需求：2.6, 2.7
 * - 2.6: 显示网格背景（1px 极浅灰色 #F1F5F9，间距 20px）
 * - 2.7: 画布缩放小于 50% 时隐藏网格以保持视觉清晰
 */

import React from 'react';

interface CanvasGridProps {
  zoom: number; // 当前缩放比例
}

/**
 * CanvasGrid 组件
 * 使用 SVG 绘制网格背景，性能更好
 */
const CanvasGrid: React.FC<CanvasGridProps> = ({ zoom }) => {
  // 网格配置
  const GRID_SIZE = 20; // 网格间距（px）
  const GRID_COLOR = '#F1F5F9'; // 极浅灰色
  const MIN_ZOOM_THRESHOLD = 0.5; // 最小显示缩放比例（50%）

  // 当缩放小于 50% 时隐藏网格（需求 2.7）
  if (zoom < MIN_ZOOM_THRESHOLD) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, ${GRID_COLOR} 1px, transparent 1px),
          linear-gradient(to bottom, ${GRID_COLOR} 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
    />
  );
};

export default CanvasGrid;
