/**
 * 组件嵌套关系检测工具
 * 基于空间位置判断组件的包含关系
 */

import type { ComponentNode } from '@/types';

/**
 * 检查组件 B 是否完全在组件 A 内部
 * @param containerComp 容器组件（外层）
 * @param childComp 子组件（内层）
 * @returns 是否完全包含
 */
export function isComponentInside(containerComp: ComponentNode, childComp: ComponentNode): boolean {
  const containerLeft = containerComp.position.x;
  const containerTop = containerComp.position.y;
  const containerRight = containerLeft + containerComp.position.width;
  const containerBottom = containerTop + containerComp.position.height;

  const childLeft = childComp.position.x;
  const childTop = childComp.position.y;
  const childRight = childLeft + childComp.position.width;
  const childBottom = childTop + childComp.position.height;

  // 子组件的所有边界都在容器内部
  return (
    childLeft >= containerLeft &&
    childTop >= containerTop &&
    childRight <= containerRight &&
    childBottom <= containerBottom
  );
}

/**
 * 找出所有在指定组件内部的组件
 * @param containerComp 容器组件
 * @param allComponents 所有组件列表
 * @returns 内部组件列表
 */
export function findComponentsInside(
  containerComp: ComponentNode,
  allComponents: ComponentNode[]
): ComponentNode[] {
  return allComponents.filter(
    comp => comp.id !== containerComp.id && isComponentInside(containerComp, comp)
  );
}

/**
 * 计算组件相对于容器的相对位置和尺寸比例
 * @param containerComp 容器组件
 * @param childComp 子组件
 * @returns 相对位置和尺寸比例
 */
export interface RelativePosition {
  xRatio: number; // X 位置比例 (0-1)
  yRatio: number; // Y 位置比例 (0-1)
  widthRatio: number; // 宽度比例 (0-1)
  heightRatio: number; // 高度比例 (0-1)
}

export function calculateRelativePosition(
  containerComp: ComponentNode,
  childComp: ComponentNode
): RelativePosition {
  const containerWidth = containerComp.position.width;
  const containerHeight = containerComp.position.height;

  // 计算子组件相对于容器左上角的偏移
  const offsetX = childComp.position.x - containerComp.position.x;
  const offsetY = childComp.position.y - containerComp.position.y;

  return {
    xRatio: offsetX / containerWidth,
    yRatio: offsetY / containerHeight,
    widthRatio: childComp.position.width / containerWidth,
    heightRatio: childComp.position.height / containerHeight,
  };
}

/**
 * 根据相对位置和新的容器尺寸，计算子组件的新位置和尺寸
 * @param containerComp 新的容器组件
 * @param relativePos 相对位置信息
 * @returns 新的位置和尺寸
 */
export function applyRelativePosition(
  containerComp: ComponentNode,
  relativePos: RelativePosition
): { x: number; y: number; width: number; height: number } {
  const newWidth = containerComp.position.width * relativePos.widthRatio;
  const newHeight = containerComp.position.height * relativePos.heightRatio;
  const newX = containerComp.position.x + containerComp.position.width * relativePos.xRatio;
  const newY = containerComp.position.y + containerComp.position.height * relativePos.yRatio;

  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  };
}

/**
 * 构建组件的嵌套关系图
 * @param components 所有组件列表
 * @returns 嵌套关系映射 { 容器ID: [子组件ID列表] }
 */
export function buildNestingMap(components: ComponentNode[]): Map<string, string[]> {
  const nestingMap = new Map<string, string[]>();

  // 对每个组件，找出它包含的所有子组件
  components.forEach(container => {
    const children = findComponentsInside(container, components);
    if (children.length > 0) {
      nestingMap.set(
        container.id,
        children.map(c => c.id)
      );
    }
  });

  return nestingMap;
}
