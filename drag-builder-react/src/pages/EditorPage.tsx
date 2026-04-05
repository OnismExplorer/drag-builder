/**
 * 编辑器页面
 * 渲染画布、物料库面板和属性编辑面板
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import { Canvas } from '../components/Canvas';
import { MaterialPanel, MATERIAL_CONFIGS } from '../components';
import PropertyPanel from '../components/PropertyPanel/PropertyPanel';
import { Toolbar } from '../components/Toolbar';
import { CodePreview } from '../components/CodePreview/CodePreview';
import { useComponentStore } from '../store';
import { useCanvasStore } from '../store';
import { useUIStore } from '../store';
import { createDefaultComponent } from '../components';
import { SnappingEngine } from '../utils';
import { createVirtualGroupComponent } from '../utils/multiSelectBounds';
import { throttle } from '../utils/timing';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { createProject } from '../api';
import type { ComponentType, ComponentNode } from '../types';

/**
 * 自定义传感器：过滤掉带有 data-no-dnd 属性的元素
 * 这样可以防止调整大小手柄触发拖拽事件
 */
class SmartPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: { nativeEvent: PointerEvent }) => {
        // 检查点击的目标元素是否有 data-no-dnd 属性
        if (event.target instanceof HTMLElement && event.target.dataset.noDnd) {
          return false; // 不启动拖拽
        }
        return true; // 启动拖拽
      },
    },
  ];
}

/**
 * 编辑器页面组件
 * 使用完整视口布局
 */
const EditorPage: React.FC = () => {
  const { components, addComponent, updateComponent, selectedIds, pushHistory } =
    useComponentStore();
  const { zoom, config } = useCanvasStore();
  const {
    setSnapLines,
    clearSnapLines,
    setDraggingComponent,
    isGridSnapEnabled,
    setDragPosition,
    setDragOffset,
    showToast,
  } = useUIStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  // 项目名称（可从路由参数或 store 获取，此处使用默认值）
  const projectName = '未命名项目';

  /**
   * 保存项目（Ctrl+S 和自动保存共用）
   */
  const isSavingRef = useRef(false);
  const handleSave = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    try {
      await createProject({
        name: projectName,
        canvasConfig: config,
        componentsTree: components,
      });
      showToast('保存成功', 'success');
    } catch (error) {
      // 记录错误详情，便于调试
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('[EditorPage] 保存项目失败:', error);
      showToast(`保存失败: ${errorMessage}`, 'error');
    } finally {
      isSavingRef.current = false;
    }
  }, [components, config, showToast, projectName]);

  /**
   * 注册键盘快捷键（Delete、Ctrl+Z/Y、Ctrl+C/V、Ctrl+S）
   */
  useKeyboardShortcuts(handleSave);

  /**
   * 自动保存（每分钟一次）
   * 需求：Ctrl+S 保存项目（实现一分钟系统自动保存一次）
   */
  useEffect(() => {
    const AUTO_SAVE_INTERVAL = 60 * 1000; // 1 分钟
    const timer = setInterval(() => {
      // 只有画布有内容时才自动保存
      if (components.length > 0) {
        handleSave();
      }
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(timer);
  }, [handleSave, components.length]);

  // 创建吸附引擎实例（使用 useMemo 避免每次渲染都创建新实例）
  const snappingEngine = useMemo(() => new SnappingEngine(), []);

  // 使用自定义的 SmartPointerSensor 来过滤调整手柄的点击
  const sensors = useSensors(
    useSensor(SmartPointerSensor, {
      activationConstraint: {
        distance: 8, // 移动 8px 后才开始拖拽，避免误触
      },
    })
  );

  /**
   * 键盘方向键移动选中的组件
   * 每次移动 1px
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 只处理方向键
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        return;
      }

      // 如果没有选中的组件，不处理
      if (selectedIds.length === 0) {
        return;
      }

      // 如果焦点在输入框中，不处理
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      // 阻止默认行为（防止页面滚动）
      event.preventDefault();

      // 计算移动偏移量
      let deltaX = 0;
      let deltaY = 0;

      switch (event.key) {
        case 'ArrowUp':
          deltaY = -1;
          break;
        case 'ArrowDown':
          deltaY = 1;
          break;
        case 'ArrowLeft':
          deltaX = -1;
          break;
        case 'ArrowRight':
          deltaX = 1;
          break;
      }

      // 先记录历史（支持撤销）
      pushHistory();

      // 移动所有选中的组件
      selectedIds.forEach(componentId => {
        const component = components.find(c => c.id === componentId);
        if (component) {
          updateComponent(componentId, {
            position: {
              ...component.position,
              x: component.position.x + deltaX,
              y: component.position.y + deltaY,
            },
          });
        }
      });
    };

    // 添加键盘事件监听
    window.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedIds, components, updateComponent, pushHistory]);

  /**
   * 处理保存项目
   * 实际保存逻辑已移至 Toolbar 组件内部（需求 10.2）
   * 此处保留空函数以兼容旧调用，后续可移除
   */

  /**
   * 处理拖拽开始事件
   */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);

    // 检查是否是拖拽画布上的组件（不是物料库的组件）
    const activeData = event.active.data.current;
    if (activeData && !activeData.isMaterial) {
      // 开始拖拽组件，显示网格
      setDraggingComponent(true);
      // 设置正在拖拽的组件 ID 和初始偏移量
      setDragOffset({ x: 0, y: 0 }, event.active.id as string);
    }
  };

  /**
   * 处理拖拽移动事件
   * 在拖拽过程中实时检测吸附并显示辅助线
   * 支持多选组件作为整体进行吸附
   * 使用节流（16ms ≈ 60fps）优化性能（需求：14.4）
   *
   * 需求：6.1, 6.2, 6.4
   */
  const handleDragMove = useMemo(
    () =>
      throttle((event: DragMoveEvent) => {
        const { active, delta } = event;
        const activeData = active.data.current;

        // 只处理画布上组件的拖拽（不处理物料库的拖拽）
        if (!activeData || activeData.isMaterial) {
          return;
        }

        // 更新拖拽偏移量（用于多选组件同步移动）
        setDragOffset(delta, active.id as string);

        // 获取正在拖拽的组件
        const movingComponent = components.find(c => c.id === active.id);
        if (!movingComponent) {
          return;
        }

        // 检查是否是多选状态
        const { selectedIds } = useComponentStore.getState();
        const isMultiSelect = selectedIds.length > 1 && selectedIds.includes(active.id as string);

        // 计算新位置（考虑缩放）
        const deltaX = delta.x / zoom;
        const deltaY = delta.y / zoom;

        let tempComponent: ComponentNode;
        let otherComponents: ComponentNode[];

        if (isMultiSelect) {
          // 多选模式：创建虚拟组件代表整体
          const selectedComponents = components.filter(c => selectedIds.includes(c.id));
          const virtualGroup = createVirtualGroupComponent(selectedComponents, deltaX, deltaY);

          if (!virtualGroup) {
            return;
          }

          tempComponent = virtualGroup;
          // 排除所有选中的组件
          otherComponents = components.filter(c => !selectedIds.includes(c.id));
        } else {
          // 单选模式：使用原有逻辑
          const newX = movingComponent.position.x + deltaX;
          const newY = movingComponent.position.y + deltaY;

          tempComponent = {
            ...movingComponent,
            position: {
              ...movingComponent.position,
              x: newX,
              y: newY,
            },
          };

          // 排除正在拖拽的组件
          otherComponents = components.filter(c => c.id !== active.id);
        }

        // 检测吸附（传递画布尺寸）
        const snappingResult = snappingEngine.detectSnapping(
          tempComponent,
          otherComponents,
          config.width,
          config.height,
          isGridSnapEnabled
        );

        // 显示辅助线
        setSnapLines(snappingResult.snapLines);

        // 更新位置提示气泡
        const finalX =
          snappingResult.snapX !== null ? snappingResult.snapX : tempComponent.position.x;
        const finalY =
          snappingResult.snapY !== null ? snappingResult.snapY : tempComponent.position.y;

        setDragPosition({
          x: finalX,
          y: finalY,
          width: tempComponent.position.width,
          height: tempComponent.position.height,
        });
      }, 16),
    [
      components,
      zoom,
      config,
      isGridSnapEnabled,
      setSnapLines,
      setDragOffset,
      setDragPosition,
      snappingEngine,
    ]
  );

  /**
   * 处理拖拽结束事件
   * 处理两种情况：
   * 1. 从物料库拖拽组件到画布（创建新组件）
   * 2. 拖拽画布上的组件（更新位置，应用吸附）
   *
   * 注意：由于使用了 SmartPointerSensor，调整大小时不会触发此函数
   *
   * 需求：6.4, 6.5
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta, activatorEvent } = event;

    // 重置 activeId
    setActiveId(null);

    // 清除吸附辅助线（需求 6.5）
    clearSnapLines();

    // 隐藏拖拽网格
    setDraggingComponent(false);

    // 清除位置提示气泡
    setDragPosition(null);

    // 清除拖拽偏移量
    setDragOffset(null, null);

    const activeData = active.data.current;

    // 情况 1：从物料库拖拽组件到画布
    if (activeData?.isMaterial && over && over.id === 'canvas-drop-zone') {
      const componentType = activeData.type as ComponentType;

      // 获取画布容器的位置（白色画布区域）
      const canvasContainer = document.querySelector('.canvas-content');
      if (canvasContainer) {
        const canvasRect = canvasContainer.getBoundingClientRect();

        // 获取拖拽开始时的鼠标位置
        const startX = (activatorEvent as PointerEvent).clientX;
        const startY = (activatorEvent as PointerEvent).clientY;

        // 计算拖拽结束时的鼠标位置（开始位置 + 拖拽偏移量）
        const dropX = startX + (delta?.x || 0);
        const dropY = startY + (delta?.y || 0);

        // 计算相对于画布的坐标（考虑缩放）
        const canvasX = (dropX - canvasRect.left) / zoom;
        const canvasY = (dropY - canvasRect.top) / zoom;

        // 先创建临时组件以获取其尺寸
        const tempComponent = createDefaultComponent(componentType, { x: 0, y: 0 });

        // 计算组件中心对齐鼠标位置的坐标（减去宽高的一半）
        const x = Math.max(0, canvasX - tempComponent.position.width / 2);
        const y = Math.max(0, canvasY - tempComponent.position.height / 2);

        // 创建新组件（使用调整后的位置）
        const newComponent = createDefaultComponent(componentType, { x, y });

        // 添加到画布
        addComponent(newComponent);
      }
    }
    // 情况 2：拖拽画布上的组件（更新位置，应用吸附）
    // 由于使用了 SmartPointerSensor，这里被触发时一定是真正的拖拽
    // 不需要复杂的检查，直接应用 delta 即可
    else if (activeData && !activeData.isMaterial && delta) {
      const componentId = active.id as string;

      // 获取正在拖拽的组件
      const movingComponent = components.find(c => c.id === componentId);
      if (!movingComponent) {
        return;
      }

      // 检查是否是多选状态
      const { selectedIds, moveMultipleComponents } = useComponentStore.getState();
      const isMultiSelect = selectedIds.length > 1 && selectedIds.includes(componentId);

      if (isMultiSelect) {
        // 批量移动：移动所有选中的组件
        const deltaX = delta.x / zoom;
        const deltaY = delta.y / zoom;

        // 多选模式：应用整体吸附
        const selectedComponents = components.filter(c => selectedIds.includes(c.id));
        const virtualGroup = createVirtualGroupComponent(selectedComponents, deltaX, deltaY);

        if (virtualGroup) {
          // 排除所有选中的组件
          const otherComponents = components.filter(c => !selectedIds.includes(c.id));

          // 检测吸附
          const snappingResult = snappingEngine.detectSnapping(
            virtualGroup,
            otherComponents,
            config.width,
            config.height,
            isGridSnapEnabled
          );

          // 计算吸附后的偏移量
          const snapDeltaX =
            snappingResult.snapX !== null
              ? snappingResult.snapX - virtualGroup.position.x + deltaX
              : deltaX;
          const snapDeltaY =
            snappingResult.snapY !== null
              ? snappingResult.snapY - virtualGroup.position.y + deltaY
              : deltaY;

          // 应用吸附后的偏移量到所有选中的组件
          moveMultipleComponents(selectedIds, snapDeltaX, snapDeltaY);
        } else {
          // 如果虚拟组件创建失败，使用原始偏移量
          moveMultipleComponents(selectedIds, deltaX, deltaY);
        }
      } else {
        // 单个组件移动：应用吸附
        // 计算新位置（考虑缩放）
        const newX = activeData.position.x + delta.x / zoom;
        const newY = activeData.position.y + delta.y / zoom;

        // 创建临时组件用于吸附检测
        const tempComponent: ComponentNode = {
          ...movingComponent,
          position: {
            ...movingComponent.position,
            x: newX,
            y: newY,
          },
        };

        // 检测吸附（排除正在拖拽的组件，传递画布尺寸）
        const otherComponents = components.filter(c => c.id !== componentId);
        const snappingResult = snappingEngine.detectSnapping(
          tempComponent,
          otherComponents,
          config.width,
          config.height,
          isGridSnapEnabled // 传递网格吸附开关状态
        );

        // 应用吸附位置（如果检测到吸附）
        const finalX = snappingResult.snapX !== null ? snappingResult.snapX : newX;
        const finalY = snappingResult.snapY !== null ? snappingResult.snapY : newY;

        // 更新组件位置（允许组件移动到画布外）
        updateComponent(componentId, {
          position: {
            ...movingComponent.position,
            x: finalX,
            y: finalY,
          },
        });
      }
    }
  };

  // 获取当前拖拽的物料配置
  const activeMaterial = activeId
    ? MATERIAL_CONFIGS.find(config => `material-${config.type}` === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen w-screen overflow-hidden bg-slate-50">
        {/* 顶部工具栏 */}
        <Toolbar projectName="未命名项目" />

        {/* 主编辑区域 - 顶部留出 Toolbar 的空间 */}
        <div className="h-[calc(100vh-4rem)] mt-16">
          {/* 物料库面板 */}
          <MaterialPanel />

          {/* 画布区域 - 留出左右侧边栏的空间 */}
          <main className="h-full pl-[280px] pr-[320px]">
            <Canvas />
          </main>

          {/* 属性编辑面板 */}
          <PropertyPanel />
        </div>

        {/* 代码预览窗口 */}
        <CodePreview />
      </div>

      {/* 拖拽覆盖层 - 显示拖拽预览 */}
      <DragOverlay>
        {activeMaterial ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-300 bg-white shadow-lg opacity-80">
            {/* 组件图标 */}
            <div className="flex items-center justify-center w-10 h-10 bg-slate-50 rounded-lg text-xl">
              {activeMaterial.icon}
            </div>
            {/* 组件名称 */}
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{activeMaterial.label}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default EditorPage;
