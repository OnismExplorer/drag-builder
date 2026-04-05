/**
 * 项目类型定义
 * 定义项目的数据结构，用于保存和加载
 */

import type { CanvasConfig } from './canvas';
import type { ComponentNode } from './component';

/**
 * 项目数据结构
 * 包含完整的项目信息，用于持久化存储
 */
export interface Project {
  id: string; // UUID v4
  name: string; // 项目名称
  canvasConfig: CanvasConfig; // 画布配置
  componentsTree: ComponentNode[]; // 组件树
  createdAt: string; // 创建时间（ISO 8601）
  updatedAt: string; // 更新时间（ISO 8601）
}
