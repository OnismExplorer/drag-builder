/**
 * Canvas 组件
 * 画布引擎核心组件，负责渲染所有组件节点和处理交互
 *
 * 需求：2.1, 2.2, 2.3, 2.4, 2.5, 4.6
 * - 2.1: 支持鼠标中键拖拽进行平移
 * - 2.2: 支持 Ctrl + 鼠标滚轮进行缩放
 * - 2.3: 缩放范围限制在 10% 到 200% 之间
 * - 2.4: 在画布右下角显示当前缩放比例
 * - 2.5: 实时更新所有组件的视觉位置
 * - 4.6: 点击画布空白区域取消所有组件选中状态
 */

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import CanvasGrid from './CanvasGrid';
import ComponentNode from './ComponentNode';
import { SnappingGuides } from './SnappingGuides';
import DragGrid from './DragGrid';
import { PositionTooltip } from './PositionTooltip';
import { useCanvasStore } from '../../store/canvasStore';
import { useComponentStore } from '../../store/componentStore';
import { useUIStore } from '../../store/uiStore';
import { throttle } from '../../utils/timing';
import {
  calculateViewport,
  filterVisibleComponents,
  VIRTUALIZATION_THRESHOLD,
} from '../../utils/virtualCanvas';

/**
 * Canvas 组件
 * 使用 transform 实现缩放和平移（GPU 加速）
 * 使用 React.memo 避免不必要的重渲染（需求：14.2）
 */
const Canvas: React.FC = React.memo(() => {
  const { config, zoom, pan, setZoom, setPan } = useCanvasStore();
  const { components, selectedIds, selectComponent } = useComponentStore();
  const { isDraggingComponent, toggleGridSnap, dragPosition } = useUIStore();

  // 设置画布为拖拽目标
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastMiddleClickTime, setLastMiddleClickTime] = useState(0);

  // 容器尺寸（用于虚拟化计算）
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 提示状态管理
  const [showZoomHint, setShowZoomHint] = useState(false); // 显示缩放提示
  const [showPanHint, setShowPanHint] = useState(false); // 显示平移提示
  const [showResetHint, setShowResetHint] = useState(false); // 显示重置提示
  const [hasZoomed, setHasZoomed] = useState(false); // 用户是否已经缩放过
  const [hasPanned, setHasPanned] = useState(false); // 用户是否已经平移过

  // 从 sessionStorage 读取"不再提示"状态
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(() => {
    const stored = sessionStorage.getItem('dismissedHints');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  /**
   * 关闭提示
   */
  const closeHint = useCallback((hintType: 'zoom' | 'pan' | 'reset') => {
    switch (hintType) {
      case 'zoom':
        setShowZoomHint(false);
        break;
      case 'pan':
        setShowPanHint(false);
        break;
      case 'reset':
        setShowResetHint(false);
        break;
    }
  }, []);

  /**
   * 不再提示（保存到 sessionStorage）
   */
  const dismissHint = useCallback(
    (hintType: 'zoom' | 'pan' | 'reset') => {
      const newDismissed = new Set(dismissedHints);
      newDismissed.add(hintType);
      setDismissedHints(newDismissed);
      sessionStorage.setItem('dismissedHints', JSON.stringify([...newDismissed]));
      closeHint(hintType);
    },
    [dismissedHints, closeHint]
  );

  /**
   * 处理画布点击（取消选中）
   * 需求：4.6
   * 支持 Ctrl + 点击多选
   */
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      // 只有点击画布本身（不是组件）时才取消选中
      if (
        e.target === e.currentTarget ||
        (e.target as HTMLElement).classList.contains('canvas-content')
      ) {
        // 如果不是 Ctrl 点击，清除所有选中
        if (!e.ctrlKey && !e.metaKey) {
          selectComponent(null);
        }
      }
    },
    [selectComponent]
  );

  /**
   * 处理鼠标中键按下（开始平移或双击重置）
   * 需求：2.1
   * - 双击中键：重置画布位置到中心（保持缩放）
   * - Ctrl + 双击中键：完全重置（位置 + 缩放）
   */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // 鼠标中键（button === 1）
      if (e.button === 1) {
        e.preventDefault();

        const currentTime = Date.now();
        const timeSinceLastClick = currentTime - lastMiddleClickTime;

        // 检测双击（300ms 内的两次点击）
        if (timeSinceLastClick < 300) {
          if (e.ctrlKey) {
            // Ctrl + 双击中键：完全重置（位置 + 缩放）
            // 由于外层容器使用 flex 居中，重置 pan 为 (0, 0) 即可居中
            setPan({ x: 0, y: 0 });
            setZoom(1);
          } else {
            // 双击中键：只重置位置到中心（保持当前缩放）
            // 由于外层容器使用 flex 居中，重置 pan 为 (0, 0) 即可居中
            setPan({ x: 0, y: 0 });
          }
          setLastMiddleClickTime(0); // 重置计时器

          // 重置视图后，3秒后淡出重置提示
          setTimeout(() => {
            setShowResetHint(false);
          }, 3000);
        } else {
          // 单击中键：开始平移
          setIsPanning(true);
          setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
          setLastMiddleClickTime(currentTime);
        }
      }
    },
    [pan, lastMiddleClickTime, setPan, setZoom]
  );

  /**
   * 处理鼠标移动（平移画布）
   * 需求：2.1, 14.4
   * 使用节流（16ms ≈ 60fps）优化性能
   * 使用全局事件监听器以支持鼠标移出画布区域
   */
  const handleMouseMove = useMemo(
    () =>
      throttle((e: MouseEvent) => {
        if (isPanning) {
          const newPan = {
            x: e.clientX - panStart.x,
            y: e.clientY - panStart.y,
          };
          setPan(newPan);

          // 首次平移时显示重置提示
          if (!hasPanned && !dismissedHints.has('reset')) {
            setHasPanned(true);
            setShowResetHint(true);
            // 同时隐藏平移提示
            setShowPanHint(false);
            // 5秒后自动淡出重置提示
            setTimeout(() => {
              setShowResetHint(false);
            }, 5000);
          }
        }
      }, 16),
    [isPanning, panStart, setPan, hasPanned, dismissedHints]
  );

  /**
   * 处理鼠标释放（结束平移）
   */
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  /**
   * 注册全局鼠标事件监听器
   * 当开始平移时，监听全局鼠标移动和释放事件
   */
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isPanning, handleMouseMove, handleMouseUp]);

  /**
   * 注册快捷键监听器
   * Ctrl + Shift + G: 切换网格吸附
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Shift + G: 切换网格吸附
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        toggleGridSnap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleGridSnap]);

  /**
   * 监听容器尺寸变化（防抖 200ms）
   * 用于虚拟化渲染的可视区域计算
   * 需求：14.4（窗口 resize 防抖 200ms）
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 初始化容器尺寸
    setContainerSize({ width: canvas.clientWidth, height: canvas.clientHeight });

    let debounceTimer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }, 200); // 防抖 200ms
      }
    });

    observer.observe(canvas);
    return () => {
      observer.disconnect();
      clearTimeout(debounceTimer);
    };
  }, []);

  /**
   * 虚拟化渲染：计算可视区域内的组件
   * 当组件数量 > 50 时启用，仅渲染可视区域内的组件
   * 需求：14.1
   */
  const visibleComponents = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return components;
    }
    const viewport = calculateViewport(
      containerSize.width,
      containerSize.height,
      config.width,
      config.height,
      zoom,
      pan
    );
    return filterVisibleComponents(components, viewport, selectedIds);
  }, [components, containerSize, config.width, config.height, zoom, pan, selectedIds]);

  /**
   * 是否启用了虚拟化（用于显示提示）
   */
  const isVirtualized = components.length > VIRTUALIZATION_THRESHOLD;

  /**
   * 阻止浏览器默认的 Ctrl + 滚轮缩放行为
   * 使用原生事件监听器，设置 passive: false 以允许 preventDefault
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    // 必须设置 passive: false 才能调用 preventDefault
    canvas.addEventListener('wheel', preventBrowserZoom, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', preventBrowserZoom);
    };
  }, []);

  /**
   * 页面加载时显示初始缩放提示
   */
  useEffect(() => {
    // 检查是否已被"不再提示"
    if (!dismissedHints.has('zoom')) {
      // 延迟1秒后显示缩放提示
      const timer = setTimeout(() => {
        setShowZoomHint(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [dismissedHints]);

  /**
   * 处理鼠标滚轮（缩放画布）
   * 需求：2.2, 2.3
   * 以鼠标位置为中心进行缩放
   */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // 只有按住 Ctrl 键时才缩放
      if (e.ctrlKey) {
        e.preventDefault();

        // 获取画布容器的尺寸和位置
        const canvasContainer = canvasRef.current;
        if (!canvasContainer) return;

        const rect = canvasContainer.getBoundingClientRect();

        // 获取鼠标位置（相对于画布容器）
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 计算缩放前，鼠标位置对应的画布坐标
        // 由于画布使用了 translate(-50% + pan.x, -50% + pan.y)
        // 需要先计算画布左上角的实际位置
        const canvasLeft = rect.width / 2 + pan.x - (config.width * zoom) / 2;
        const canvasTop = rect.height / 2 + pan.y - (config.height * zoom) / 2;

        // 鼠标相对于画布左上角的位置
        const canvasMouseX = (mouseX - canvasLeft) / zoom;
        const canvasMouseY = (mouseY - canvasTop) / zoom;

        // 计算新的缩放比例
        const delta = -e.deltaY * 0.001; // 缩放速度
        const newZoom = Math.max(0.1, Math.min(2.0, zoom + delta)); // 限制在 0.1 - 2.0 范围内

        // 计算缩放后，为了保持鼠标位置对应的画布坐标不变，需要的新平移偏移量
        // 新的画布左上角位置
        const newCanvasLeft = mouseX - canvasMouseX * newZoom;
        const newCanvasTop = mouseY - canvasMouseY * newZoom;

        // 转换为 pan 值
        const newPanX = newCanvasLeft - rect.width / 2 + (config.width * newZoom) / 2;
        const newPanY = newCanvasTop - rect.height / 2 + (config.height * newZoom) / 2;

        // 更新缩放和平移
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });

        // 首次缩放时显示平移提示
        if (!hasZoomed && !showPanHint && !dismissedHints.has('pan')) {
          setHasZoomed(true);
          setShowPanHint(true);
          // 3秒后淡出平移提示
          setTimeout(() => {
            setShowPanHint(false);
          }, 3000);
        }
      }
    },
    [zoom, pan, config, setZoom, setPan, hasZoomed, showPanHint, dismissedHints]
  );

  /**
   * 画布样式（应用缩放和定位）
   * 使用绝对定位 + transform 实现居中、缩放和平移
   */
  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${zoom})`,
    transformOrigin: 'center center', // 从中心开始缩放
    width: `${config.width}px`,
    height: `${config.height}px`,
    backgroundColor: config.backgroundColor,
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-slate-100"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* 网格背景 */}
      <CanvasGrid zoom={zoom} />

      {/* 画布内容容器 - 设置为拖拽目标 */}
      <div ref={setNodeRef} className={`absolute inset-0 ${isOver ? 'bg-blue-50/20' : ''}`}>
        {/* 画布（应用缩放和定位） */}
        <div className="canvas-content relative shadow-lg" style={canvasStyle}>
          {/* 拖拽网格参考线 - 只在拖拽组件时显示 */}
          {isDraggingComponent && (
            <DragGrid width={config.width} height={config.height} gridSize={20} />
          )}

          {/* 吸附辅助线 - 需求：6.2, 6.5 */}
          <SnappingGuides />

          {/* 位置提示气泡 - 拖动组件时显示坐标 */}
          {dragPosition && (
            <PositionTooltip
              x={dragPosition.x}
              y={dragPosition.y}
              componentWidth={dragPosition.width}
              componentHeight={dragPosition.height}
              isVisible={true}
            />
          )}

          {/* 画布空状态提示 - 当没有组件时显示引导文字 */}
          {components.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center select-none">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-slate-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-400">从左侧拖拽组件开始设计</p>
                <p className="text-xs text-slate-300 mt-1">支持 Div、Button、Text、Image、Input</p>
              </div>
            </div>
          )}

          {/* 渲染所有组件节点（按 zIndex 排序） */}
          {/* 虚拟化：组件数量 > 50 时仅渲染可视区域内的组件（需求：14.1） */}
          {visibleComponents
            .slice()
            .sort((a, b) => a.position.zIndex - b.position.zIndex)
            .map(component => (
              <ComponentNode
                key={component.id}
                component={component}
                isSelected={selectedIds.includes(component.id)}
              />
            ))}
        </div>
      </div>

      {/* 缩放比例显示（右下角）- 需求：2.4 */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2">
        {/* 虚拟化状态提示（需求：14.1） */}
        {isVirtualized && (
          <div className="px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="text-xs text-orange-600 font-medium">
              虚拟化渲染中（{visibleComponents.length}/{components.length}）
            </span>
          </div>
        )}
        <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200">
          <span className="text-sm font-medium text-slate-700">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* 操作提示（左下角） - 渐进式引导 */}
      <div className="absolute bottom-4 left-4 space-y-2">
        {/* 初始提示：缩放画布 */}
        {showZoomHint && (
          <div
            className={`px-4 py-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 transition-opacity duration-1000 ${
              showZoomHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="space-y-2">
              <div className="text-xs text-slate-600 flex items-center space-x-2">
                <span className="font-medium text-slate-700">💡 提示</span>
                <span>按住 Ctrl + 滚轮可以缩放画布</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => dismissHint('zoom')}
                  className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  不再提示
                </button>
                <button
                  onClick={() => closeHint('zoom')}
                  className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 第二步提示：平移画布 */}
        {showPanHint && (
          <div
            className={`px-4 py-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 transition-opacity duration-1000 ${
              showPanHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="space-y-2">
              <div className="text-xs text-slate-600 flex items-center space-x-2">
                <span className="font-medium text-slate-700">💡 提示</span>
                <span>按住鼠标中键可以拖拽平移画布</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => dismissHint('pan')}
                  className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  不再提示
                </button>
                <button
                  onClick={() => closeHint('pan')}
                  className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 第三步提示：重置视图 */}
        {showResetHint && (
          <div
            className={`px-4 py-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 transition-opacity duration-1000 ${
              showResetHint ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="space-y-2">
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-700">💡 提示</span>
                  <span>双击鼠标中键可以让画布回到中心</span>
                </div>
                <div className="pl-6 text-slate-500">按住 Ctrl + 双击可以完全重置（包括缩放）</div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => dismissHint('reset')}
                  className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  不再提示
                </button>
                <button
                  onClick={() => closeHint('reset')}
                  className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1 rounded hover:bg-slate-100 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default Canvas;
