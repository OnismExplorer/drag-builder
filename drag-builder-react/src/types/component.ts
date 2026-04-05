/**
 * 组件类型定义
 * 定义画布上所有组件节点的数据结构
 */

/**
 * 组件类型枚举
 * 支持的基础组件类型
 */
export type ComponentType =
  | 'div'
  | 'button'
  | 'text'
  | 'image'
  | 'input'
  | 'radio'
  | 'checkbox'
  | 'tag';

/**
 * 位置和尺寸
 * 定义组件在画布上的位置、大小和层级
 */
export interface Position {
  x: number; // 画布相对 X 坐标（px）
  y: number; // 画布相对 Y 坐标（px）
  width: number; // 宽度（px）
  height: number; // 高度（px）
  zIndex: number; // 层级（0-999）
}

/**
 * 阴影配置
 * 定义组件阴影效果的参数
 */
export interface ShadowConfig {
  x: number; // X 偏移（px）
  y: number; // Y 偏移（px）
  blur: number; // 模糊半径（px）
  color: string; // 阴影颜色（HEX）
}

/**
 * 样式配置
 * 定义组件的视觉样式属性
 */
export interface ComponentStyles {
  backgroundColor?: string; // 背景色（HEX）
  borderColor?: string; // 边框颜色（HEX）
  borderWidth?: number; // 边框宽度（px）
  borderRadius?: number; // 圆角（px）
  textColor?: string; // 文字颜色（HEX）
  fontSize?: number; // 字体大小（px）
  fontWeight?: number; // 字体粗细（100-900）
  padding?: number; // 内边距（px）
  shadow?: ShadowConfig; // 阴影配置
}

/**
 * 内容配置
 * 定义组件的内容数据
 */
export interface ComponentContent {
  text?: string; // 文本内容
  src?: string; // 图片 URL
  placeholder?: string; // 占位符文本
  alt?: string; // 图片替代文本
  options?: RadioCheckboxOption[]; // 单选/多选选项列表
}

/**
 * 单选/多选选项
 */
export interface RadioCheckboxOption {
  id: string; // 选项唯一标识
  label: string; // 选项文本
  checked: boolean; // 是否选中
  disabled?: boolean; // 是否禁用
}

/**
 * 动画配置（Framer Motion）
 * 定义组件的动画效果参数
 */
export interface AnimationConfig {
  initial?: Record<string, string | number | boolean>; // 初始状态
  animate?: Record<string, string | number | boolean>; // 动画目标状态
  transition?: {
    duration: number; // 持续时间（秒）
    delay: number; // 延迟时间（秒）
    ease: string; // 缓动函数
  };
}

/**
 * 组件节点 - 画布上的可视化元素
 * 这是核心数据结构，描述画布上的每个组件
 */
export interface ComponentNode {
  id: string; // UUID v4
  type: ComponentType; // 组件类型
  position: Position; // 位置和尺寸
  styles: ComponentStyles; // 样式配置
  content: ComponentContent; // 内容配置
  animation?: AnimationConfig; // 动画配置（可选）
  children?: ComponentNode[]; // 子组件（支持嵌套）
  props?: Record<string, PropertyValue>; // 组件特有属性（用于适配器组件）
}

/**
 * 属性值类型
 */
export type PropertyValue = string | number | boolean;
