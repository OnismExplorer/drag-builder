/**
 * ResizeHandles 组件
 * 组件调整手柄，支持 8 个方向的尺寸调整
 *
 * 需求：5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 * - 5.1: 拖拽角落手柄同时调整宽度和高度
 * - 5.2: 拖拽边缘手柄仅调整对应方向的尺寸
 * - 5.3: 按住 Shift 键拖拽角落手柄保持组件宽高比
 * - 5.4: 限制组件最小尺寸为 20x20px
 * - 5.5: 限制组件最大尺寸为画布尺寸的 2 倍
 * - 5.6: 尺寸改变时实时更新属性面板中的宽高数值
 */

import React, { useCallback, useState, useEffect } from 'react';
import type { ComponentNode } from '../../types';
import { useComponentStore } from '../../store/componentStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useUIStore } from '../../store/uiStore';
import { SnappingEngine, type SnapLine } from '../../utils/snapping';
import {
  findComponentsInside,
  calculateRelativePosition,
  applyRelativePosition,
  type RelativePosition,
} from '../../utils/componentNesting';

/**
 * 手柄类型
 * 定义 8 个调整手柄的位置和调整方向
 */
type HandleType =
  | 'top-left' // 左上角：同时调整宽高
  | 'top-right' // 右上角：同时调整宽高
  | 'bottom-left' // 左下角：同时调整宽高
  | 'bottom-right' // 右下角：同时调整宽高
  | 'top' // 顶部中点：仅调整高度
  | 'bottom' // 底部中点：仅调整高度
  | 'left' // 左侧中点：仅调整宽度
  | 'right'; // 右侧中点：仅调整宽度

/**
 * 手柄配置
 * 定义每个手柄的样式和光标
 */
interface HandleConfig {
  type: HandleType;
  className: string; // Tailwind 类名（定位）
  cursor: string; // 光标样式
}

/**
 * 8 个手柄的配置
 */
const HANDLES: HandleConfig[] = [
  // 四角手柄
  { type: 'top-left', className: '-top-1 -left-1', cursor: 'nwse-resize' },
  { type: 'top-right', className: '-top-1 -right-1', cursor: 'nesw-resize' },
  { type: 'bottom-left', className: '-bottom-1 -left-1', cursor: 'nesw-resize' },
  { type: 'bottom-right', className: '-bottom-1 -right-1', cursor: 'nwse-resize' },

  // 四边中点手柄
  { type: 'top', className: '-top-1 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
  { type: 'bottom', className: '-bottom-1 left-1/2 -translate-x-1/2', cursor: 'ns-resize' },
  { type: 'left', className: '-left-1 top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
  { type: 'right', className: '-right-1 top-1/2 -translate-y-1/2', cursor: 'ew-resize' },
];

/**
 * 尺寸限制常量
 */
const MIN_SIZE = 20; // 最小尺寸 20x20px（需求 5.4）

interface ResizeHandlesProps {
  component: ComponentNode;
  onResizeEnd?: () => void; // 调整结束时的回调
}

/**
 * ResizeHandles 组件
 * 渲染 8 个调整手柄并处理拖拽调整逻辑
 */
const ResizeHandles: React.FC<ResizeHandlesProps> = ({ component, onResizeEnd }) => {
  const { components, updateComponent, pushHistory } = useComponentStore();
  const { config } = useCanvasStore();
  const { setSnapLines, clearSnapLines } = useUIStore();

  // 创建吸附引擎实例（使用 useMemo 避免每次渲染都创建新实例）
  const snappingEngine = React.useMemo(() => new SnappingEngine(), []);

  // 拖拽状态
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);

  // 嵌套组件状态：存储内部组件的初始相对位置
  const [nestedComponents, setNestedComponents] = useState<Map<string, RelativePosition>>(
    new Map()
  );

  /**
   * 计算最大尺寸（画布尺寸的 2 倍）
   * 需求：5.5
   */
  const maxWidth = config.width * 2;
  const maxHeight = config.height * 2;

  /**
   * 限制尺寸在有效范围内
   */
  const clampSize = useCallback(
    (width: number, height: number) => {
      return {
        width: Math.max(MIN_SIZE, Math.min(maxWidth, width)),
        height: Math.max(MIN_SIZE, Math.min(maxHeight, height)),
      };
    },
    [maxWidth, maxHeight]
  );

  /**
   * 监听 Shift 键状态
   * 需求：5.3
   * 使用 useCallback 确保回调稳定，避免重复注册监听器
   */
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setIsShiftPressed(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  /**
   * 处理手柄鼠标按下（开始调整）
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handleType: HandleType) => {
      e.stopPropagation(); // 阻止事件冒泡到组件节点
      e.preventDefault();

      setIsResizing(true);
      setActiveHandle(handleType);
      setStartPos({ x: e.clientX, y: e.clientY });
      setStartSize({
        width: component.position.width,
        height: component.position.height,
        x: component.position.x,
        y: component.position.y,
      });

      // 记录初始宽高比（用于 Shift 键约束）
      setAspectRatio(component.position.width / component.position.height);

      // 获取当前选中的组件 ID 列表
      const { selectedIds } = useComponentStore.getState();

      // 检测嵌套组件：找出所有在当前组件内部的组件
      const insideComponents = findComponentsInside(component, components);

      // 只对同时被选中的内部组件进行缩放
      // 过滤出既在内部又被选中的组件
      const selectedInsideComponents = insideComponents.filter(child =>
        selectedIds.includes(child.id)
      );

      // 计算并存储每个选中的内部组件的相对位置
      const relativePositions = new Map<string, RelativePosition>();
      selectedInsideComponents.forEach(child => {
        const relativePos = calculateRelativePosition(component, child);
        relativePositions.set(child.id, relativePos);
      });

      setNestedComponents(relativePositions);
    },
    [component, components]
  );

  /**
   * 处理鼠标移动（调整尺寸）
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !activeHandle) return;

      // 获取当前画布缩放比例
      const { zoom } = useCanvasStore.getState();

      // 计算鼠标移动距离（考虑画布缩放）
      const deltaX = (e.clientX - startPos.x) / zoom;
      const deltaY = (e.clientY - startPos.y) / zoom;

      // 根据手柄类型计算新的尺寸和位置
      let newWidth = startSize.width;
      let newHeight = startSize.height;
      let newX = startSize.x;
      let newY = startSize.y;

      switch (activeHandle) {
        // 角落手柄：同时调整宽高（需求 5.1）
        case 'top-left':
          newWidth = startSize.width - deltaX;
          newHeight = startSize.height - deltaY;
          newX = startSize.x + deltaX;
          newY = startSize.y + deltaY;
          break;

        case 'top-right':
          newWidth = startSize.width + deltaX;
          newHeight = startSize.height - deltaY;
          newY = startSize.y + deltaY;
          // X 位置不变
          break;

        case 'bottom-left':
          newWidth = startSize.width - deltaX;
          newHeight = startSize.height + deltaY;
          newX = startSize.x + deltaX;
          // Y 位置不变
          break;

        case 'bottom-right':
          newWidth = startSize.width + deltaX;
          newHeight = startSize.height + deltaY;
          // X, Y 位置都不变
          break;

        // 边缘手柄：仅调整对应方向（需求 5.2）
        case 'top':
          newHeight = startSize.height - deltaY;
          newY = startSize.y + deltaY;
          break;

        case 'bottom':
          newHeight = startSize.height + deltaY;
          // Y 位置不变
          break;

        case 'left':
          newWidth = startSize.width - deltaX;
          newX = startSize.x + deltaX;
          break;

        case 'right':
          newWidth = startSize.width + deltaX;
          // X 位置不变
          break;
      }

      // Shift 键约束：保持宽高比（仅对角落手柄生效）
      // 需求：5.3
      if (
        isShiftPressed &&
        ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(activeHandle)
      ) {
        // 根据宽度变化计算高度，保持宽高比
        const widthChange = newWidth - startSize.width;
        const heightChange = newHeight - startSize.height;

        if (Math.abs(widthChange) > Math.abs(heightChange)) {
          // 以宽度为准
          newHeight = newWidth / aspectRatio;
          // 调整位置（对于顶部手柄）
          if (activeHandle === 'top-left' || activeHandle === 'top-right') {
            newY = startSize.y + startSize.height - newHeight;
          }
        } else {
          // 以高度为准
          newWidth = newHeight * aspectRatio;
          // 调整位置（对于左侧手柄）
          if (activeHandle === 'top-left' || activeHandle === 'bottom-left') {
            newX = startSize.x + startSize.width - newWidth;
          }
        }
      }

      // 限制尺寸在有效范围内（需求 5.4, 5.5）
      const clampedSize = clampSize(newWidth, newHeight);
      let finalWidth = clampedSize.width;
      let finalHeight = clampedSize.height;

      // 最终位置
      let finalX = newX;
      let finalY = newY;

      // 当尺寸被限制时，需要调整位置以保持正确的锚点
      // 注意：只有当尺寸真的被限制了（与计算值不同）时才调整
      const widthClamped = finalWidth !== newWidth;
      const heightClamped = finalHeight !== newHeight;

      if (
        widthClamped &&
        (activeHandle === 'left' || activeHandle === 'top-left' || activeHandle === 'bottom-left')
      ) {
        // 从左侧调整且宽度被限制时，重新计算 X 以保持右边界固定
        finalX = startSize.x + startSize.width - finalWidth;
      }

      if (
        heightClamped &&
        (activeHandle === 'top' || activeHandle === 'top-left' || activeHandle === 'top-right')
      ) {
        // 从顶部调整且高度被限制时，重新计算 Y 以保持底边界固定
        finalY = startSize.y + startSize.height - finalHeight;
      }

      // 获取所有其他组件用于吸附检测
      const otherComponents = components.filter(c => c.id !== component.id);

      // 收集所有可能的吸附参考线
      const xGuides: number[] = [];
      const yGuides: number[] = [];

      // 添加画布边缘作为参考线
      xGuides.push(0, config.width);
      yGuides.push(0, config.height);

      // 添加画布中心作为参考线
      xGuides.push(config.width / 2);
      yGuides.push(config.height / 2);

      // 添加其他组件的边界作为参考线
      otherComponents.forEach(other => {
        xGuides.push(other.position.x, other.position.x + other.position.width);
        yGuides.push(other.position.y, other.position.y + other.position.height);
      });

      // 根据手柄类型，对正在移动的边界进行吸附检测
      const snapLines: SnapLine[] = [];

      // 处理水平方向的吸附（左边界或右边界）
      if (
        activeHandle === 'left' ||
        activeHandle === 'top-left' ||
        activeHandle === 'bottom-left'
      ) {
        // 从左侧调整：检测左边界吸附
        const leftEdge = finalX;
        let minDiff = Infinity;
        let snapToX: number | null = null;

        for (const guide of xGuides) {
          const diff = Math.abs(leftEdge - guide);
          if (diff < snappingEngine['SNAP_THRESHOLD'] && diff < minDiff) {
            minDiff = diff;
            snapToX = guide;
          }
        }

        if (snapToX !== null) {
          // 应用吸附：调整 X 和宽度
          const deltaX = snapToX - finalX;
          finalX = snapToX;
          finalWidth = finalWidth - deltaX;

          // 确保宽度不小于最小值
          if (finalWidth < MIN_SIZE) {
            finalWidth = MIN_SIZE;
            finalX = startSize.x + startSize.width - MIN_SIZE;
          } else {
            // 添加辅助线
            snapLines.push({
              type: 'vertical',
              position: snapToX,
              refStart: 0,
              refEnd: config.height,
            });
          }
        }
      } else if (
        activeHandle === 'right' ||
        activeHandle === 'top-right' ||
        activeHandle === 'bottom-right'
      ) {
        // 从右侧调整：检测右边界吸附
        const rightEdge = finalX + finalWidth;
        let minDiff = Infinity;
        let snapToX: number | null = null;

        for (const guide of xGuides) {
          const diff = Math.abs(rightEdge - guide);
          if (diff < snappingEngine['SNAP_THRESHOLD'] && diff < minDiff) {
            minDiff = diff;
            snapToX = guide;
          }
        }

        if (snapToX !== null) {
          // 应用吸附：只调整宽度，X 保持不变
          finalWidth = snapToX - finalX;

          // 确保宽度不小于最小值
          if (finalWidth < MIN_SIZE) {
            finalWidth = MIN_SIZE;
          } else {
            // 添加辅助线
            snapLines.push({
              type: 'vertical',
              position: snapToX,
              refStart: 0,
              refEnd: config.height,
            });
          }
        }
      }

      // 处理垂直方向的吸附（上边界或下边界）
      if (activeHandle === 'top' || activeHandle === 'top-left' || activeHandle === 'top-right') {
        // 从顶部调整：检测上边界吸附
        const topEdge = finalY;
        let minDiff = Infinity;
        let snapToY: number | null = null;

        for (const guide of yGuides) {
          const diff = Math.abs(topEdge - guide);
          if (diff < snappingEngine['SNAP_THRESHOLD'] && diff < minDiff) {
            minDiff = diff;
            snapToY = guide;
          }
        }

        if (snapToY !== null) {
          // 应用吸附：调整 Y 和高度
          const deltaY = snapToY - finalY;
          finalY = snapToY;
          finalHeight = finalHeight - deltaY;

          // 确保高度不小于最小值
          if (finalHeight < MIN_SIZE) {
            finalHeight = MIN_SIZE;
            finalY = startSize.y + startSize.height - MIN_SIZE;
          } else {
            // 添加辅助线
            snapLines.push({
              type: 'horizontal',
              position: snapToY,
              refStart: 0,
              refEnd: config.width,
            });
          }
        }
      } else if (
        activeHandle === 'bottom' ||
        activeHandle === 'bottom-left' ||
        activeHandle === 'bottom-right'
      ) {
        // 从底部调整：检测下边界吸附
        const bottomEdge = finalY + finalHeight;
        let minDiff = Infinity;
        let snapToY: number | null = null;

        for (const guide of yGuides) {
          const diff = Math.abs(bottomEdge - guide);
          if (diff < snappingEngine['SNAP_THRESHOLD'] && diff < minDiff) {
            minDiff = diff;
            snapToY = guide;
          }
        }

        if (snapToY !== null) {
          // 应用吸附：只调整高度，Y 保持不变
          finalHeight = snapToY - finalY;

          // 确保高度不小于最小值
          if (finalHeight < MIN_SIZE) {
            finalHeight = MIN_SIZE;
          } else {
            // 添加辅助线
            snapLines.push({
              type: 'horizontal',
              position: snapToY,
              refStart: 0,
              refEnd: config.width,
            });
          }
        }
      }

      // 显示辅助线
      setSnapLines(snapLines);

      // 更新组件尺寸和位置（需求 5.6）
      updateComponent(component.id, {
        position: {
          ...component.position,
          width: finalWidth,
          height: finalHeight,
          x: finalX,
          y: finalY,
        },
      });

      // 同步更新嵌套组件的位置和尺寸
      if (nestedComponents.size > 0) {
        // 创建一个临时的组件对象，表示调整后的容器
        const resizedContainer: ComponentNode = {
          ...component,
          position: {
            ...component.position,
            width: finalWidth,
            height: finalHeight,
            x: finalX,
            y: finalY,
          },
        };

        // 对每个嵌套组件应用相对位置
        nestedComponents.forEach((relativePos, childId) => {
          const newChildPos = applyRelativePosition(resizedContainer, relativePos);

          // 确保子组件尺寸不小于最小值
          const clampedChildWidth = Math.max(MIN_SIZE, newChildPos.width);
          const clampedChildHeight = Math.max(MIN_SIZE, newChildPos.height);

          // 获取子组件当前状态
          const childComponent = components.find(c => c.id === childId);
          if (childComponent) {
            updateComponent(childId, {
              position: {
                ...childComponent.position,
                x: newChildPos.x,
                y: newChildPos.y,
                width: clampedChildWidth,
                height: clampedChildHeight,
              },
            });
          }
        });
      }
    },
    [
      isResizing,
      activeHandle,
      startPos,
      startSize,
      isShiftPressed,
      aspectRatio,
      clampSize,
      updateComponent,
      component,
      components,
      config,
      snappingEngine,
      setSnapLines,
      nestedComponents,
    ]
  );

  /**
   * 处理鼠标释放（结束调整）
   */
  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      // 结束 resize 时记录历史（支持撤销）
      if (isResizing) {
        pushHistory();
      }

      setIsResizing(false);
      setActiveHandle(null);
      // 清除吸附辅助线
      clearSnapLines();
      // 清除嵌套组件状态
      setNestedComponents(new Map());

      // 阻止点击事件触发（防止调整后触发组件的 onClick）
      e.stopPropagation();
      e.preventDefault();

      // 通知父组件调整已结束
      if (onResizeEnd) {
        onResizeEnd();
      }
    },
    [clearSnapLines, onResizeEnd, isResizing, pushHistory]
  );

  /**
   * 注册全局鼠标事件监听器
   */
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <>
      {HANDLES.map(handle => (
        <div
          key={handle.type}
          // 添加 data-no-dnd 属性，告诉 @dnd-kit 不要在这个元素上启动拖拽
          data-no-dnd="true"
          className={`absolute w-2 h-2 bg-blue-500 rounded-full ${handle.className} z-50`}
          style={{ cursor: handle.cursor }}
          onMouseDown={e => handleMouseDown(e, handle.type)}
        />
      ))}
    </>
  );
};

export default ResizeHandles;
