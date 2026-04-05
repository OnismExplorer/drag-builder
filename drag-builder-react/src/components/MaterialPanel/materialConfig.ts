/**
 * 物料配置
 * 定义基础组件的默认样式和属性
 *
 * 需求：3.6 - 组件生成时应用默认样式
 */

import type { ComponentType, ComponentNode } from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 物料项配置接口
 */
export interface MaterialConfig {
  type: ComponentType;
  label: string;
  icon: string;
  description: string;
  backgroundColor?: string; // 组件背景色
  starColor?: string; // 星光边框颜色
}

/**
 * 物料分类接口
 */
export interface MaterialCategory {
  id: string;
  name: string;
  items: MaterialConfig[];
}

/**
 * 基础组件配置
 */
const BASIC_COMPONENTS: MaterialConfig[] = [
  {
    type: 'div',
    label: '容器',
    icon: '□',
    description: '通用容器组件',
    backgroundColor: '#f0f9ff',
    starColor: '#38bdf8',
  },
  {
    type: 'button',
    label: '按钮',
    icon: '▭',
    description: '可点击按钮',
    backgroundColor: '#fef3c7',
    starColor: '#fbbf24',
  },
  {
    type: 'text',
    label: '文本',
    icon: 'T',
    description: '文本内容',
    backgroundColor: '#f3e8ff',
    starColor: '#a78bfa',
  },
  {
    type: 'image',
    label: '图片',
    icon: '🖼',
    description: '图片组件',
    backgroundColor: '#ecfdf5',
    starColor: '#34d399',
  },
  {
    type: 'input',
    label: '输入框',
    icon: '⎯',
    description: '文本输入框',
    backgroundColor: '#fce7f3',
    starColor: '#f472b6',
  },
];

/**
 * 表单组件配置
 */
const FORM_COMPONENTS: MaterialConfig[] = [
  {
    type: 'radio',
    label: '单选',
    icon: '◉',
    description: '单选按钮',
    backgroundColor: '#dbeafe',
    starColor: '#60a5fa',
  },
  {
    type: 'checkbox',
    label: '多选',
    icon: '☑',
    description: '多选框',
    backgroundColor: '#fef9c3',
    starColor: '#facc15',
  },
  {
    type: 'tag',
    label: '标签',
    icon: '#',
    description: '标签组件',
    backgroundColor: '#fce7f3',
    starColor: '#ec4899',
  },
];

/**
 * 物料库分类配置列表
 */
export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  {
    id: 'basic',
    name: '基础组件',
    items: BASIC_COMPONENTS,
  },
  {
    id: 'form',
    name: '表单组件',
    items: FORM_COMPONENTS,
  },
];

/**
 * 所有物料配置（向后兼容）
 */
export const MATERIAL_CONFIGS: MaterialConfig[] = [...BASIC_COMPONENTS, ...FORM_COMPONENTS];

/**
 * 创建默认组件节点
 * 根据组件类型生成带有默认样式的组件节点
 *
 * @param type 组件类型
 * @param position 初始位置（可选，默认为 {x: 0, y: 0}）
 * @returns 完整的组件节点
 */
export function createDefaultComponent(
  type: ComponentType,
  position: { x: number; y: number } = { x: 0, y: 0 }
): ComponentNode {
  const baseComponent: ComponentNode = {
    id: uuidv4(),
    type,
    position: {
      x: position.x,
      y: position.y,
      width: 0,
      height: 0,
      zIndex: 0,
    },
    styles: {},
    content: {},
  };

  // 根据组件类型设置默认样式
  switch (type) {
    case 'div':
      // Div: 200x100px, 边框 1px slate-200, 圆角 16px
      return {
        ...baseComponent,
        position: {
          ...baseComponent.position,
          width: 200,
          height: 100,
          zIndex: 0,
        },
        styles: {
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0', // slate-200
          borderWidth: 1,
          borderRadius: 16,
        },
        content: {},
      };

    case 'button':
      // Button: 120x40px, 背景 #C2410C, 文字白色, 圆角 8px
      return {
        ...baseComponent,
        position: {
          ...baseComponent.position,
          width: 120,
          height: 40,
          zIndex: 0,
        },
        styles: {
          backgroundColor: '#C2410C', // 主色调橙红色
          borderColor: '#C2410C',
          borderWidth: 0,
          borderRadius: 8,
          textColor: '#FFFFFF', // 白色文字
          fontSize: 14,
          fontWeight: 500,
        },
        content: {
          text: '按钮',
        },
      };

    case 'text':
      // Text: 字体 16px, 颜色 slate-900
      return {
        ...baseComponent,
        position: {
          ...baseComponent.position,
          width: 100,
          height: 24,
          zIndex: 0,
        },
        styles: {
          textColor: '#0F172A', // slate-900
          fontSize: 16,
          fontWeight: 400,
        },
        content: {
          text: '文本内容',
        },
      };

    case 'image':
      // Image: 200x200px, 占位符灰色背景
      return {
        ...baseComponent,
        position: {
          ...baseComponent.position,
          width: 200,
          height: 200,
          zIndex: 0,
        },
        styles: {
          backgroundColor: '#F1F5F9', // slate-100 占位符背景
          borderRadius: 8,
        },
        content: {
          src: '',
          alt: '图片',
        },
      };

    case 'input':
      // Input: 240x40px, 边框 1px slate-200, 圆角 8px
      return {
        ...baseComponent,
        position: {
          ...baseComponent.position,
          width: 240,
          height: 40,
          zIndex: 0,
        },
        styles: {
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0', // slate-200
          borderWidth: 1,
          borderRadius: 8,
          textColor: '#0F172A', // slate-900
          fontSize: 14,
          padding: 8,
        },
        content: {
          placeholder: '请输入内容',
        },
      };

    case 'radio':
      // Radio: 单选按钮组，默认2个选项
      return {
        ...baseComponent,
        position: {
          ...baseComponent.position,
          width: 200,
          height: 80,
          zIndex: 0,
        },
        styles: {
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          borderRadius: 8,
          textColor: '#0F172A',
          fontSize: 14,
          padding: 12,
        },
        content: {
          options: [
            { id: uuidv4(), label: '选项 1', checked: true, disabled: false },
            { id: uuidv4(), label: '选项 2', checked: false, disabled: false },
          ],
        },
      };

    case 'checkbox':
      // Checkbox: 多选框组，默认3个选项
      return {
        ...baseComponent,
        position: {
          ...baseComponent.position,
          width: 200,
          height: 100,
          zIndex: 0,
        },
        styles: {
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          borderWidth: 1,
          borderRadius: 8,
          textColor: '#0F172A',
          fontSize: 14,
          padding: 12,
        },
        content: {
          options: [
            { id: uuidv4(), label: '选项 1', checked: false, disabled: false },
            { id: uuidv4(), label: '选项 2', checked: false, disabled: false },
            { id: uuidv4(), label: '选项 3', checked: false, disabled: false },
          ],
        },
      };

    case 'tag':
      // Tag: 80x28px, 标签
      return {
        ...baseComponent,
        position: {
          ...baseComponent.position,
          width: 80,
          height: 28,
          zIndex: 0,
        },
        styles: {
          backgroundColor: '#F1F5F9',
          borderColor: '#CBD5E1',
          borderWidth: 1,
          borderRadius: 14,
          textColor: '#475569',
          fontSize: 12,
          fontWeight: 500,
        },
        content: {
          text: '标签',
        },
      };

    default:
      return baseComponent;
  }
}
