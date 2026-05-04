/**
 * Ant Design 组件配置类型定义
 * 用于配置驱动的方式定义 antd 组件
 */

import type { PropertyGroup } from '@store/componentRegistry';

/**
 * 属性值类型
 */
export type AntdPropertyValue = string | number | boolean;

/**
 * 组件默认值配置
 */
export interface AntdComponentDefaults {
  position: { x: number; y: number; width: number; height: number; zIndex: number };
  styles?: Record<string, AntdPropertyValue>;
  content?: Record<string, unknown>;
  props?: Record<string, AntdPropertyValue>;
}

/**
 * Antd 组件配置
 * 用于定义 antd 组件的属性和行为
 */
export interface AntdComponentConfig {
  // 唯一标识 (如 'antd-button')
  type: string;

  // antd 实际组件名 (如 'Button')
  component: string;

  // 所属模块 (如 'antd')
  module?: string;

  // 物料面板配置
  material: {
    label: string;
    icon: string;
    iconSource?: 'lucide' | 'antd';
    description?: string;
    backgroundColor?: string;
    starColor?: string;
    category: string;
    subcategory?: string;
  };

  // 默认值
  defaults: AntdComponentDefaults;

  // 属性配置
  propertyGroups: PropertyGroup[];

  // 是否支持触发器
  supportsTriggers?: boolean;

  // 代码生成
  codeGen?: {
    // import 语句
    imports?: string[];
    // JSX 生成函数
    generateJSX?: (component: import('@/types').ComponentNode) => string;
  };
}

/**
 * Antd 组件分类
 */
export type AntdCategory = 'form' | 'inputs' | 'display';

/**
 * 分类配置
 */
export interface AntdCategoryConfig {
  id: AntdCategory;
  name: string;
  order: number;
}
