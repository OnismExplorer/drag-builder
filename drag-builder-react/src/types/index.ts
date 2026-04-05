/**
 * 类型定义入口文件
 * 统一导出所有类型定义
 */

// 组件相关类型
export type {
  ComponentType,
  Position,
  ShadowConfig,
  ComponentStyles,
  ComponentContent,
  AnimationConfig,
  ComponentNode,
} from './component';

// 画布相关类型
export type { CanvasPreset, CanvasConfig, CanvasState } from './canvas';

export { CANVAS_PRESETS } from './canvas';

// 项目相关类型
export type { Project } from './project';
