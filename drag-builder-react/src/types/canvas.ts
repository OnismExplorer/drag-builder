/**
 * 画布类型定义
 * 定义画布配置、状态和预设规格
 */

import type { ComponentNode } from './component';

/**
 * 画布预设规格
 * 提供常用设备尺寸的预设选项
 */
export type CanvasPreset = 'mobile' | 'tablet' | 'desktop' | 'custom';

/**
 * 画布配置
 * 定义画布的基本属性
 */
export interface CanvasConfig {
  width: number; // 画布宽度（px）
  height: number; // 画布高度（px）
  preset: CanvasPreset; // 预设规格
  backgroundColor: string; // 背景色（HEX）
}

/**
 * 画布状态
 * 包含画布的完整状态信息
 */
export interface CanvasState {
  config: CanvasConfig; // 画布配置
  components: ComponentNode[]; // 组件树（扁平化存储）
  selectedId: string | null; // 当前选中组件 ID
  zoom: number; // 缩放比例（0.1 - 2.0）
  pan: { x: number; y: number }; // 平移偏移量
}

/**
 * 预设尺寸映射
 * 定义各种设备预设的默认尺寸
 */
export const CANVAS_PRESETS: Record<CanvasPreset, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  custom: { width: 800, height: 600 }, // 默认值
};
