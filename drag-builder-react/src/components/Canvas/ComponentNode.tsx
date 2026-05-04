/**
 * ComponentNode 组件
 * 组件节点渲染器，负责渲染画布上的各种组件类型
 *
 * 需求：3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4
 * - 3.4: 从物料库拖拽组件到画布创建新组件
 * - 3.5: 组件在鼠标释放位置生成
 * - 3.6: 应用默认样式
 * - 4.1: 点击组件选中
 * - 4.2: 显示蓝色选中边框
 * - 4.3: 显示 8 个调整手柄
 * - 4.4: 拖拽选中的组件实时更新位置
 *
 * 动画支持：使用 ComponentRegistry 和 framer-motion
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import ResizeHandles from './ResizeHandles';
import type { ComponentNode as ComponentNodeType } from '@/types';
import { useCanvasStore, useComponentStore } from '@store';
import { useUIStore } from '@store/uiStore';
import { componentRegistry } from '@store/componentRegistry';
import { useAnimationPreview } from '@hooks/useAnimationPreview';

interface ComponentNodeProps {
  component: ComponentNodeType;
  isSelected: boolean;
}

/**
 * ComponentNode 组件
 * 动态渲染不同类型的组件
 * 使用 React.memo 避免不必要的重渲染（需求：14.2）
 */
const ComponentNode: React.FC<ComponentNodeProps> = React.memo(({ component, isSelected }) => {
  const { selectComponent, selectedIds } = useComponentStore();
  const { zoom } = useCanvasStore();
  const { dragOffset: uiDragOffset, draggingComponentId: uiDraggingComponentId } = useUIStore();

  // 标志：是否刚刚完成了调整操作
  const [justResized, setJustResized] = useState(false);

  // 集成 @dnd-kit 拖拽功能
  // 只有选中的组件才能被拖拽
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: component.id,
    data: component,
    disabled: !isSelected, // 未选中时禁用拖拽
  });

  // 获取组件定义
  const definition = useMemo(() => componentRegistry.get(component.type), [component.type]);

  /**
   * 过滤拖拽监听器，只响应鼠标左键
   * 防止鼠标中键（用于平移画布）触发组件拖拽
   */
  const filteredListeners = React.useMemo(() => {
    if (!listeners) return {};

    return {
      ...listeners,
      onPointerDown: (e: React.PointerEvent) => {
        // 只有鼠标左键（button === 0）才触发拖拽
        if (e.button === 0 && listeners.onPointerDown) {
          listeners.onPointerDown(e);
        }
      },
    };
  }, [listeners]);

  /**
   * 处理组件点击（选中/多选）
   * 需求：4.1
   * 支持 Ctrl + 点击多选
   */
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // 阻止事件冒泡到画布

      // 如果刚刚完成了调整操作，忽略这次点击
      if (justResized) {
        setJustResized(false);
        return;
      }

      // Ctrl/Cmd + 点击：切换多选
      if (e.ctrlKey || e.metaKey) {
        const { toggleSelectComponent } = useComponentStore.getState();
        toggleSelectComponent(component.id);
      } else {
        // 普通点击：单选
        selectComponent(component.id);
      }
    },
    [component.id, selectComponent, justResized]
  );

  /**
   * 处理调整结束
   */
  const handleResizeEnd = useCallback(() => {
    // 设置标志，防止立即触发点击事件
    setJustResized(true);
    // 100ms 后重置标志
    setTimeout(() => {
      setJustResized(false);
    }, 100);
  }, []);

  /**
   * 根据类型渲染不同元素
   * 需求：3.6
   *
   * 优先使用 Registry 中的 render 函数，fallback 到内置渲染
   */
  const renderContent = () => {
    // 如果 Registry 中有定义，使用 Registry 的 render 函数
    if (definition?.render) {
      return definition.render({
        component,
        isSelected,
        onClick: handleClick,
        onResizeEnd: handleResizeEnd,
      });
    }

    // Fallback: 使用内置渲染（实际上所有内置组件都已注册到 registry，不会走到这里）
    // 这里保留是为了防止万一有未注册的组件类型
    return null;
  };

  /**
   * 组件容器样式（位置和尺寸）
   * 应用拖拽变换（考虑画布缩放）
   * 支持多选组件同步移动动画
   */
  // 判断当前组件是否正在被拖拽
  // 1. 自己正在被拖拽（isDragging）
  // 2. 或者是多选中的其他组件，且正在拖拽的组件也在选中列表中
  const isDraggingSelected = uiDraggingComponentId && selectedIds.includes(uiDraggingComponentId);
  const isBeingDragged =
    isDragging ||
    (uiDragOffset &&
      isDraggingSelected &&
      uiDraggingComponentId !== component.id &&
      selectedIds.includes(component.id));

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${component.position.x}px`,
    top: `${component.position.y}px`,
    width: `${component.position.width}px`,
    height: `${component.position.height}px`,
    zIndex: component.position.zIndex,
    // 拖拽时的偏移量需要除以 zoom，因为画布已经被缩放了
    // 如果是被拖拽的组件，使用 useDraggable 的 transform
    // 如果是多选中的其他组件，使用共享的 dragOffset（但只有当拖拽的组件也在选中列表中时）
    transform: transform
      ? `translate3d(${transform.x / zoom}px, ${transform.y / zoom}px, 0)`
      : uiDragOffset &&
          isDraggingSelected &&
          uiDraggingComponentId !== component.id &&
          selectedIds.includes(component.id)
        ? `translate3d(${uiDragOffset.x / zoom}px, ${uiDragOffset.y / zoom}px, 0)`
        : undefined,
    // 所有正在被拖拽的组件都显示半透明
    opacity: isBeingDragged ? 0.5 : 1,
    // 只有选中的组件显示移动光标
    cursor: isSelected ? 'move' : 'pointer',
  };

  /**
   * 选中边框样式
   * 需求：4.2
   */
  const selectionStyle: React.CSSProperties = isSelected
    ? {
        outline: '2px solid #3B82F6',
        outlineOffset: '0px',
      }
    : {};

  /**
   * 动画配置
   * 只有在预览模式时，才传入 framer-motion 的核心动画属性
   */
  const { isPreviewing, stopPreview } = useAnimationPreview(component.animation);

  // 用于强制重置动画的 key
  // 预览时 key 包含动画配置，确保每次点击都重播
  // 非预览时 key 恢复为 component.id，组件回归自然状态
  const animationKey = isPreviewing
    ? `preview-${component.id}-${JSON.stringify(component.animation)}`
    : component.id;

  // 只有在预览时，才传入 animationProps
  const animationProps =
    isPreviewing && component.animation
      ? {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initial: component.animation.initial as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          animate: component.animation.animate as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          transition: component.animation.transition as any,
        }
      : undefined;

  // 动画是否刚刚播放完毕（用于清除 framer-motion 样式残留）
  const [animationJustCompleted, setAnimationJustCompleted] = useState(false);

  /**
   * 动画播放完毕后的回调
   * 停止预览并复原（对于退出/移动/变化类动画会清除 animation 配置）
   */
  const handleAnimationComplete = useCallback(() => {
    setAnimationJustCompleted(true);
    // 200ms 后重置标志
    setTimeout(() => setAnimationJustCompleted(false), 200);

    // 停止预览
    if (isPreviewing) {
      stopPreview();
    }
  }, [isPreviewing, stopPreview]);

  // 用于清除 framer-motion 样式残留的 style
  const resetStyle: React.CSSProperties = animationJustCompleted
    ? { transform: '', opacity: '' }
    : {};

  // hasAnimation 只用于判断是否显示 motion.div 包装
  const hasAnimation = component.animation && definition?.render;

  // 包装容器，处理动画
  if (hasAnimation) {
    return (
      <motion.div
        key={animationKey}
        ref={setNodeRef}
        className="component-node"
        style={{ ...containerStyle, ...selectionStyle, ...resetStyle }}
        onClick={handleClick}
        {...filteredListeners}
        {...attributes}
        {...animationProps}
        onAnimationComplete={handleAnimationComplete}
      >
        {renderContent()}

        {/* 调整手柄（8 个：四角 + 四边中点）- 需求：4.3, 5.1-5.6 */}
        {isSelected && <ResizeHandles component={component} onResizeEnd={handleResizeEnd} />}
      </motion.div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className="component-node"
      style={{ ...containerStyle, ...selectionStyle, ...resetStyle }}
      onClick={handleClick}
      {...filteredListeners}
      {...attributes}
    >
      {renderContent()}

      {/* 调整手柄（8 个：四角 + 四边中点）- 需求：4.3, 5.1-5.6 */}
      {isSelected && <ResizeHandles component={component} onResizeEnd={handleResizeEnd} />}
    </div>
  );
});

export default ComponentNode;
