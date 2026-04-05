/**
 * 虚拟化画布工具
 * 当组件数量 > 50 时，仅渲染可视区域内的组件
 *
 * 需求：14.1
 */

import type { ComponentNode } from '../types';

/**
 * 可视区域矩形
 */
export interface ViewportRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * 虚拟化阈值：超过此数量时启用虚拟化渲染
 */
export const VIRTUALIZATION_THRESHOLD = 50;

/**
 * 可视区域扩展缓冲（px）
 * 在可视区域外额外渲染一定范围，避免滚动时出现空白
 */
const VIEWPORT_BUFFER = 200;

/**
 * 根据画布的 zoom 和 pan 计算当前可视区域（画布坐标系）
 *
 * @param containerWidth 画布容器宽度（px）
 * @param containerHeight 画布容器高度（px）
 * @param canvasWidth 画布宽度（px）
 * @param canvasHeight 画布高度（px）
 * @param zoom 当前缩放比例
 * @param pan 当前平移偏移量
 * @returns 可视区域（画布坐标系）
 */
export function calculateViewport(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number,
  pan: { x: number; y: number }
): ViewportRect {
  // 画布左上角在容器中的位置（像素）
  const canvasLeft = containerWidth / 2 + pan.x - (canvasWidth * zoom) / 2;
  const canvasTop = containerHeight / 2 + pan.y - (canvasHeight * zoom) / 2;

  // 容器可视区域在画布坐标系中的范围
  const viewLeft = -canvasLeft / zoom - VIEWPORT_BUFFER;
  const viewTop = -canvasTop / zoom - VIEWPORT_BUFFER;
  const viewRight = (containerWidth - canvasLeft) / zoom + VIEWPORT_BUFFER;
  const viewBottom = (containerHeight - canvasTop) / zoom + VIEWPORT_BUFFER;

  return {
    left: viewLeft,
    top: viewTop,
    right: viewRight,
    bottom: viewBottom,
  };
}

/**
 * 判断组件是否在可视区域内
 *
 * @param component 组件节点
 * @param viewport 可视区域
 * @returns 是否可见
 */
export function isComponentVisible(component: ComponentNode, viewport: ViewportRect): boolean {
  const { x, y, width, height } = component.position;

  // 组件矩形与可视区域有交集则可见
  return (
    x < viewport.right &&
    x + width > viewport.left &&
    y < viewport.bottom &&
    y + height > viewport.top
  );
}

/**
 * 过滤出可视区域内的组件
 * 当组件数量 <= VIRTUALIZATION_THRESHOLD 时，返回全部组件（不启用虚拟化）
 *
 * @param components 所有组件
 * @param viewport 可视区域
 * @param selectedIds 选中的组件 ID（选中的组件始终渲染）
 * @returns 需要渲染的组件列表
 */
export function filterVisibleComponents(
  components: ComponentNode[],
  viewport: ViewportRect,
  selectedIds: string[]
): ComponentNode[] {
  // 组件数量未超过阈值，不启用虚拟化
  if (components.length <= VIRTUALIZATION_THRESHOLD) {
    return components;
  }

  // 超过阈值：只渲染可视区域内的组件，以及选中的组件（确保选中状态正常）
  return components.filter(
    component => isComponentVisible(component, viewport) || selectedIds.includes(component.id)
  );
}
