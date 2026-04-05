/**
 * 画布状态 Store
 * 管理画布配置、缩放、平移等全局状态
 *
 * 使用 Zustand + Immer 中间件确保不可变更新
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { CanvasConfig } from '../types';
import { CANVAS_PRESETS } from '../types';

/**
 * 画布状态接口
 */
interface CanvasStore {
  // 状态
  config: CanvasConfig;
  zoom: number;
  pan: { x: number; y: number };

  // 操作方法
  setConfig: (config: CanvasConfig) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetCanvas: () => void;
}

/**
 * 默认画布配置
 */
const DEFAULT_CONFIG: CanvasConfig = {
  width: CANVAS_PRESETS.desktop.width,
  height: CANVAS_PRESETS.desktop.height,
  preset: 'desktop',
  backgroundColor: '#FFFFFF',
};

/**
 * 缩放范围常量
 */
const MIN_ZOOM = 0.1; // 10%
const MAX_ZOOM = 2.0; // 200%

/**
 * 限制缩放值在有效范围内
 */
const clampZoom = (zoom: number): number => {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
};

/**
 * 创建画布状态 Store
 *
 * 需求：2.1, 2.2, 2.3
 * - 2.1: 支持鼠标中键拖拽进行平移
 * - 2.2: 支持 Ctrl + 鼠标滚轮进行缩放
 * - 2.3: 缩放范围限制在 10% 到 200% 之间
 */
export const useCanvasStore = create<CanvasStore>()(
  immer(set => ({
    // 初始状态
    config: DEFAULT_CONFIG,
    zoom: 1.0,
    pan: { x: 0, y: 0 },

    /**
     * 设置画布配置
     * @param config 新的画布配置
     */
    setConfig: (config: CanvasConfig) => {
      set(state => {
        state.config = config;
      });
    },

    /**
     * 设置缩放比例
     * 自动限制在 0.1 - 2.0 范围内
     * @param zoom 缩放比例
     */
    setZoom: (zoom: number) => {
      set(state => {
        state.zoom = clampZoom(zoom);
      });
    },

    /**
     * 设置平移偏移量
     * @param pan 平移偏移量 { x, y }
     */
    setPan: (pan: { x: number; y: number }) => {
      set(state => {
        state.pan = pan;
      });
    },

    /**
     * 重置画布到初始状态
     * 恢复默认配置、缩放和平移
     */
    resetCanvas: () => {
      set(state => {
        state.config = DEFAULT_CONFIG;
        state.zoom = 1.0;
        state.pan = { x: 0, y: 0 };
      });
    },
  }))
);
