/**
 * DragGrid 组件
 * 在拖拽组件时显示网格参考线
 *
 * 功能：
 * - 只在拖拽组件时显示
 * - 显示固定间距的网格线（默认 20px）
 * - 网格线颜色为半透明蓝色
 * - 覆盖整个画布区域
 */

import React from 'react';

interface DragGridProps {
  width: number;
  height: number;
  gridSize?: number;
}

/**
 * DragGrid 组件
 * 渲染拖拽时的网格参考线
 */
const DragGrid: React.FC<DragGridProps> = ({ width, height, gridSize = 20 }) => {
  // 计算需要绘制的网格线数量
  const verticalLines = Math.floor(width / gridSize);
  const horizontalLines = Math.floor(height / gridSize);

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ zIndex: 1 }}
    >
      {/* 垂直网格线 */}
      {Array.from({ length: verticalLines + 1 }).map((_, i) => {
        const x = i * gridSize;
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2={height}
            stroke="rgba(59, 130, 246, 0.2)"
            strokeWidth="1"
          />
        );
      })}

      {/* 水平网格线 */}
      {Array.from({ length: horizontalLines + 1 }).map((_, i) => {
        const y = i * gridSize;
        return (
          <line
            key={`h-${i}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="rgba(59, 130, 246, 0.2)"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
};

export default DragGrid;
