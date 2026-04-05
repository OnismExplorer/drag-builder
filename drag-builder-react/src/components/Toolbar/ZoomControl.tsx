/**
 * ZoomControl 组件
 * 缩放控制组件，显示当前缩放比例并提供缩放按钮
 *
 * 需求：2.4
 * - 2.4: 在画布右下角显示当前缩放比例
 */

import React from 'react';
import { useCanvasStore } from '../../store/canvasStore';

/**
 * 缩放步长（每次点击增加/减少的比例）
 */
const ZOOM_STEP = 0.1;

/**
 * 缩放范围常量
 */
const MIN_ZOOM = 0.1; // 10%
const MAX_ZOOM = 2.0; // 200%

/**
 * ZoomControl 组件
 * 显示当前缩放比例（例如："100%"）
 * 提供缩放按钮（+/-）
 */
const ZoomControl: React.FC = () => {
  const { zoom, setZoom } = useCanvasStore();

  /**
   * 处理放大按钮点击
   * 每次增加 10%，最大 200%
   */
  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + ZOOM_STEP, MAX_ZOOM);
    setZoom(newZoom);
  };

  /**
   * 处理缩小按钮点击
   * 每次减少 10%，最小 10%
   */
  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
    setZoom(newZoom);
  };

  /**
   * 处理重置缩放（点击百分比文字）
   * 重置为 100%
   */
  const handleResetZoom = () => {
    setZoom(1.0);
  };

  /**
   * 格式化缩放比例为百分比字符串
   */
  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 
                    bg-slate-50 border border-slate-200 rounded-lg"
    >
      {/* 缩小按钮 */}
      <button
        onClick={handleZoomOut}
        disabled={zoom <= MIN_ZOOM}
        className="w-7 h-7 flex items-center justify-center
                   text-slate-700 hover:text-slate-900
                   hover:bg-slate-100 rounded
                   disabled:text-slate-400 disabled:cursor-not-allowed
                   transition-colors duration-200"
        title="缩小 (Ctrl + 滚轮向下)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>

      {/* 当前缩放比例 */}
      <button
        onClick={handleResetZoom}
        className="min-w-[60px] px-2 py-1 text-sm font-medium text-slate-700
                   hover:text-slate-900 hover:bg-slate-100 rounded
                   transition-colors duration-200"
        title="点击重置为 100%"
      >
        {zoomPercentage}%
      </button>

      {/* 放大按钮 */}
      <button
        onClick={handleZoomIn}
        disabled={zoom >= MAX_ZOOM}
        className="w-7 h-7 flex items-center justify-center
                   text-slate-700 hover:text-slate-900
                   hover:bg-slate-100 rounded
                   disabled:text-slate-400 disabled:cursor-not-allowed
                   transition-colors duration-200"
        title="放大 (Ctrl + 滚轮向上)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default ZoomControl;
