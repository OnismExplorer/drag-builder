/**
 * PositionTooltip 组件
 * 拖动组件时显示位置坐标的气泡提示
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PositionTooltipProps {
  x: number;
  y: number;
  componentWidth: number;
  componentHeight: number;
  isVisible: boolean;
}

/**
 * PositionTooltip 组件
 * 显示在组件下方的位置坐标气泡，箭头对齐组件底边中心
 */
export const PositionTooltip: React.FC<PositionTooltipProps> = ({
  x,
  y,
  componentWidth,
  componentHeight,
  isVisible,
}) => {
  // 计算组件底边中心点的位置
  const componentCenterX = x + componentWidth / 2;
  const componentBottomY = y + componentHeight;

  // 气泡位置：在组件底边中心下方 12px
  const tooltipY = componentBottomY + 12;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="absolute pointer-events-none"
          style={{
            left: `${componentCenterX}px`,
            top: `${tooltipY}px`,
            zIndex: 10000,
          }}
        >
          {/* 整个气泡容器，使用 transform 居中 */}
          <div className="relative" style={{ transform: 'translateX(-50%)' }}>
            {/* 气泡箭头 - 指向组件底边中心 */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                top: '-6px',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '6px solid rgba(15, 23, 42, 0.95)',
              }}
            />

            {/* 气泡内容 */}
            <div
              className="
                px-3 py-2
                bg-slate-900/95 backdrop-blur-sm
                text-white text-sm font-medium
                rounded-lg
                shadow-lg
                whitespace-nowrap
              "
            >
              X: {Math.round(x)} Y: {Math.round(y)}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
