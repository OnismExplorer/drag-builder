/**
 * 多选组件边界框计算工具
 */

import type { ComponentNode } from '@/types';

/**
 * 多选组件的边界框
 */
export interface MultiSelectBounds {
  x: number; // 左上角 X 坐标
  y: number; // 左上角 Y 坐标
  width: number; // 总宽度
  height: number; // 总高度
  centerX: number; // 中心点 X 坐标
  centerY: number; // 中心点 Y 坐标
  right: number; // 右边界
  bottom: number; // 下边界
}

/**
 * 计算多个组件的边界框
 * @param components 组件列表
 * @returns 边界框信息
 */
export function calculateMultiSelectBounds(components: ComponentNode[]): MultiSelectBounds | null {
  if (components.length === 0) {
    return null;
  }

  // 找出所有组件的最小和最大边界
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  components.forEach(comp => {
    const left = comp.position.x;
    const top = comp.position.y;
    const right = left + comp.position.width;
    const bottom = top + comp.position.height;

    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, right);
    maxY = Math.max(maxY, bottom);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  return {
    x: minX,
    y: minY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
    right: maxX,
    bottom: maxY,
  };
}

/**
 * 创建一个虚拟组件来代表多选组件的整体
 * 用于吸附检测
 * @param components 选中的组件列表
 * @param deltaX X 轴偏移量
 * @param deltaY Y 轴偏移量
 * @returns 虚拟组件
 */
export function createVirtualGroupComponent(
  components: ComponentNode[],
  deltaX: number = 0,
  deltaY: number = 0
): ComponentNode | null {
  const bounds = calculateMultiSelectBounds(components);

  if (!bounds) {
    return null;
  }

  // 创建一个虚拟组件来代表整个组
  return {
    id: 'virtual-group',
    type: 'div',
    position: {
      x: bounds.x + deltaX,
      y: bounds.y + deltaY,
      width: bounds.width,
      height: bounds.height,
      zIndex: 0,
    },
    styles: {
      backgroundColor: 'transparent',
    },
    content: {},
  };
}
