/**
 * 组件注册表
 * 管理所有组件定义的生命周期，支持运行时注册/注销
 *
 * 设计目标：
 * 1. 组件注册与核心渲染解耦
 * 2. 支持运行时注册/注销
 * 3. 为 MaterialPanel、PropertyPanel、CodeGenerator 提供统一的数据源
 */

import type { ComponentNode, ComponentType } from '../types';

// ============================================================
// 类型定义
// ============================================================

/**
 * 属性值类型
 */
export type PropertyValue = string | number | boolean;

/**
 * 属性输入控件类型
 */
export type PropertyInputType = 'number' | 'string' | 'color' | 'select' | 'checkbox' | 'slider';

/**
 * 属性定义 - 描述如何编辑组件属性
 */
export interface PropertyDefinition {
  key: string; // 属性键名 (e.g., 'backgroundColor')
  label: string; // UI 显示名称
  type: PropertyInputType;
  defaultValue?: PropertyValue; // 默认值
  // 类型特定配置
  min?: number; // number/slider 最小值
  max?: number; // number/slider 最大值
  step?: number; // slider 步进值
  options?: { label: string; value: PropertyValue }[]; // select 选项
  suffix?: string; // number 后缀 (e.g., 'px', 's')
  // 条件显示
  visibleWhen?: { key: string; value: PropertyValue }; // 依赖条件
}

/**
 * 属性分组 - 将属性组织成 UI 分组
 */
export interface PropertyGroup {
  id: string; // 分组 ID
  label: string; // 分组显示名称
  properties: PropertyDefinition[];
}

/**
 * 物料面板配置
 */
export interface MaterialConfig {
  type: string; // 组件类型 (唯一标识)
  label: string; // 显示名称
  icon: string; // 图标 (Lucide 图标名)
  description?: string; // 描述文字
  backgroundColor?: string; // 预览背景色
  starColor?: string; // 星光边框色
  category: string; // 分类 ID
}

/**
 * 动画属性组 ID
 */
export const ANIMATION_PROPERTY_GROUP_ID = 'animation';

/**
 * 动画属性组
 */
export interface AnimationPropertyGroup {
  id: typeof ANIMATION_PROPERTY_GROUP_ID;
  label: '动画配置';
  properties: PropertyDefinition[];
}

/**
 * 渲染函数 props
 */
export interface RenderProps {
  component: ComponentNode;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onResizeEnd: () => void;
}

/**
 * 组件定义 - 核心数据结构
 */
export interface ComponentDefinition {
  // 唯一标识
  type: string;

  // 物料面板配置
  material: MaterialConfig;

  // 组件默认值
  defaults: {
    position: { x: number; y: number; width: number; height: number; zIndex: number };
    styles: Record<string, PropertyValue>;
    content: Record<string, unknown>;
    props?: Record<string, PropertyValue>;
    animation?: {
      initial?: Record<string, string | number | boolean>;
      animate?: Record<string, string | number | boolean>;
      transition?: { duration: number; delay: number; ease: string };
    };
  };

  // 属性配置 (用于 PropertyPanel 动态表单生成)
  propertyGroups: (PropertyGroup | AnimationPropertyGroup)[];

  // 渲染函数
  render: (props: RenderProps) => React.ReactNode;

  // 代码生成配置
  codeGen: {
    // 生成 JSX 模板的函数
    generateJSX: (component: ComponentNode, style: string, className: string) => string;
    // 生成 CSS 的函数 (可选, CSS 模式时使用)
    generateCSS?: (component: ComponentNode) => string;
  };
}

/**
 * 组件适配器 - 用于封装第三方组件库
 */
export interface ComponentAdapter {
  namespace: string; // 命名空间 (e.g., 'antd', 'mui')
  components: Record<string, ComponentDefinition>; // 该命名空间下的组件
}

/**
 * 分类配置
 */
export interface CategoryConfig {
  id: string;
  name: string;
  order: number;
}

// ============================================================
// ComponentRegistry 类
// ============================================================

/**
 * Component Registry
 * 组件注册表 - 管理所有组件定义的生命周期
 */
class ComponentRegistry {
  private definitions = new Map<string, ComponentDefinition>();
  private adapters = new Map<string, ComponentAdapter>();
  private categories = new Map<string, CategoryConfig>();

  // ============ 注册/注销 ============

  /**
   * 注册单个组件定义
   */
  register(definition: ComponentDefinition): void {
    if (this.definitions.has(definition.type)) {
      console.warn(`[Registry] Component "${definition.type}" is already registered. Overwriting.`);
    }
    this.definitions.set(definition.type, definition);

    // 自动注册分类
    this.registerCategory(definition.material.category);
  }

  /**
   * 注册多个组件
   */
  registerMany(definitions: ComponentDefinition[]): void {
    definitions.forEach(def => this.register(def));
  }

  /**
   * 注销组件
   */
  unregister(type: string): boolean {
    return this.definitions.delete(type);
  }

  /**
   * 注册组件适配器 (封装第三方库)
   */
  registerAdapter(adapter: ComponentAdapter): void {
    this.adapters.set(adapter.namespace, adapter);
    // 将适配器中的组件注册到主注册表
    Object.values(adapter.components).forEach(def => this.register(def));
  }

  // ============ 查询 ============

  /**
   * 获取组件定义
   */
  get(type: string): ComponentDefinition | undefined {
    return this.definitions.get(type);
  }

  /**
   * 获取所有组件定义
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * 按分类获取组件
   */
  getByCategory(categoryId: string): ComponentDefinition[] {
    return this.getAll().filter(def => def.material.category === categoryId);
  }

  /**
   * 获取所有分类 (带排序)
   */
  getCategories(): CategoryConfig[] {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * 获取物料面板配置 (扁平化)
   */
  getMaterials(): MaterialConfig[] {
    return this.getAll().map(def => def.material);
  }

  /**
   * 获取物料面板配置 (按分类分组)
   */
  getMaterialsByCategory(): { category: string; items: MaterialConfig[] }[] {
    const materials = this.getMaterials();
    const grouped = materials.reduce(
      (acc, mat) => {
        (acc[mat.category] ||= []).push(mat);
        return acc;
      },
      {} as Record<string, MaterialConfig[]>
    );

    return Object.entries(grouped).map(([category, items]) => ({ category, items }));
  }

  // ============ 分类管理 ============

  private registerCategory(categoryId: string): void {
    if (!this.categories.has(categoryId)) {
      // 默认分类顺序
      const defaultOrder = this.categories.size * 10;
      this.categories.set(categoryId, {
        id: categoryId,
        name: categoryId,
        order: defaultOrder,
      });
    }
  }

  /**
   * 设置分类顺序
   */
  setCategoryOrder(categories: CategoryConfig[]): void {
    categories.forEach(cat => this.categories.set(cat.id, cat));
  }

  // ============ 工厂方法 ============

  /**
   * 创建默认组件节点
   */
  createDefault(type: string, position: { x: number; y: number }): ComponentNode | null {
    const def = this.get(type);
    if (!def) {
      console.error(`[Registry] Unknown component type: ${type}`);
      return null;
    }

    return {
      id: crypto.randomUUID(),
      type: type as ComponentType,
      position: {
        x: position.x,
        y: position.y,
        width: def.defaults.position.width,
        height: def.defaults.position.height,
        zIndex: def.defaults.position.zIndex,
      },
      styles: { ...def.defaults.styles },
      content: { ...def.defaults.content },
      animation: def.defaults.animation ? { ...def.defaults.animation } : undefined,
    };
  }
}

// ============================================================
// 导出单例
// ============================================================

export const componentRegistry = new ComponentRegistry();
