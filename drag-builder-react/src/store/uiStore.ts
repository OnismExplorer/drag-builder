/**
 * UI 状态 Store
 * 管理模态框、Toast、加载状态等 UI 交互
 *
 * 使用 Zustand + Immer 中间件确保不可变更新
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { SnapLine } from '../utils/snapping';

/**
 * Toast 状态接口
 */
export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'waiting';
  timestamp: number;
  position?:
    | 'top-right'
    | 'top-center'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-center'
    | 'bottom-left';
}

/**
 * UI 状态接口
 */
interface UIStore {
  // 状态
  isCodePreviewOpen: boolean;
  isCanvasSizeModalOpen: boolean;
  toast: ToastState | null;
  isLoading: boolean;
  snapLines: SnapLine[]; // 吸附辅助线
  isDraggingComponent: boolean; // 是否正在拖拽组件
  isGridSnapEnabled: boolean; // 是否启用网格吸附
  dragPosition: { x: number; y: number; width: number; height: number } | null; // 拖拽时的位置信息
  dragOffset: { x: number; y: number } | null; // 当前拖拽偏移量（用于多选组件同步移动）
  draggingComponentId: string | null; // 正在拖拽的组件 ID

  // 操作方法
  openCodePreview: () => void;
  closeCodePreview: () => void;
  openCanvasSizeModal: () => void;
  closeCanvasSizeModal: () => void;
  showToast: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' | 'waiting',
    position?:
      | 'top-right'
      | 'top-center'
      | 'top-left'
      | 'bottom-right'
      | 'bottom-center'
      | 'bottom-left'
  ) => void;
  hideToast: () => void;
  setLoading: (loading: boolean) => void;
  setSnapLines: (lines: SnapLine[]) => void; // 设置吸附辅助线
  clearSnapLines: () => void; // 清除吸附辅助线
  setDraggingComponent: (isDragging: boolean) => void; // 设置拖拽状态
  toggleGridSnap: () => void; // 切换网格吸附开关
  setGridSnap: (enabled: boolean) => void; // 设置网格吸附状态
  setDragPosition: (
    position: { x: number; y: number; width: number; height: number } | null
  ) => void; // 设置拖拽位置
  setDragOffset: (offset: { x: number; y: number } | null, componentId: string | null) => void; // 设置拖拽偏移量
}

/**
 * 创建 UI 状态 Store
 *
 * 需求：1.2, 9.2, 15.1
 * - 1.2: 弹出画布规格选择模态框
 * - 9.2: 打开代码预览模态窗口
 * - 15.1: 显示 Toast 错误提示
 */
export const useUIStore = create<UIStore>()(
  immer(set => ({
    // 初始状态
    isCodePreviewOpen: false,
    isCanvasSizeModalOpen: false,
    toast: null,
    isLoading: false,
    snapLines: [],
    isDraggingComponent: false,
    isGridSnapEnabled: true, // 默认启用网格吸附
    dragPosition: null, // 拖拽位置信息
    dragOffset: null, // 拖拽偏移量
    draggingComponentId: null, // 正在拖拽的组件 ID

    /**
     * 打开代码预览窗口
     */
    openCodePreview: () => {
      set(state => {
        state.isCodePreviewOpen = true;
      });
    },

    /**
     * 关闭代码预览窗口
     */
    closeCodePreview: () => {
      set(state => {
        state.isCodePreviewOpen = false;
      });
    },

    /**
     * 打开画布规格选择模态框
     */
    openCanvasSizeModal: () => {
      set(state => {
        state.isCanvasSizeModalOpen = true;
      });
    },

    /**
     * 关闭画布规格选择模态框
     */
    closeCanvasSizeModal: () => {
      set(state => {
        state.isCanvasSizeModalOpen = false;
      });
    },

    /**
     * 显示 Toast 提示
     * Toast 会自动在 3 秒后消失（由组件处理）
     * @param message 提示消息
     * @param type 提示类型（success/error/info/warning/waiting）
     * @param position 显示位置（默认：top-right）
     */
    showToast: (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' | 'waiting',
      position:
        | 'top-right'
        | 'top-center'
        | 'top-left'
        | 'bottom-right'
        | 'bottom-center'
        | 'bottom-left' = 'top-right'
    ) => {
      set(state => {
        state.toast = {
          message,
          type,
          timestamp: Date.now(),
          position,
        };
      });
    },

    /**
     * 隐藏 Toast 提示
     */
    hideToast: () => {
      set(state => {
        state.toast = null;
      });
    },

    /**
     * 设置加载状态
     * 用于显示加载动画（如保存项目时）
     * @param loading 是否正在加载
     */
    setLoading: (loading: boolean) => {
      set(state => {
        state.isLoading = loading;
      });
    },

    /**
     * 设置吸附辅助线
     * 用于在拖拽组件时显示对齐辅助线
     * @param lines 辅助线数组
     */
    setSnapLines: (lines: SnapLine[]) => {
      set(state => {
        state.snapLines = lines;
      });
    },

    /**
     * 清除吸附辅助线
     * 用于在拖拽结束后隐藏辅助线
     */
    clearSnapLines: () => {
      set(state => {
        state.snapLines = [];
      });
    },

    /**
     * 设置拖拽状态
     * 用于在拖拽组件时显示网格参考线
     * @param isDragging 是否正在拖拽
     */
    setDraggingComponent: (isDragging: boolean) => {
      set(state => {
        state.isDraggingComponent = isDragging;
      });
    },

    /**
     * 切换网格吸附开关
     * 用于快捷键切换网格吸附功能
     */
    toggleGridSnap: () => {
      set(state => {
        state.isGridSnapEnabled = !state.isGridSnapEnabled;
      });
    },

    /**
     * 设置网格吸附状态
     * @param enabled 是否启用网格吸附
     */
    setGridSnap: (enabled: boolean) => {
      set(state => {
        state.isGridSnapEnabled = enabled;
      });
    },

    /**
     * 设置拖拽位置信息
     * 用于显示位置提示气泡
     * @param position 位置信息（x, y, width, height）或 null
     */
    setDragPosition: (position: { x: number; y: number; width: number; height: number } | null) => {
      set(state => {
        state.dragPosition = position;
      });
    },

    /**
     * 设置拖拽偏移量
     * 用于多选组件同步移动动画
     * @param offset 偏移量（x, y）或 null
     * @param componentId 正在拖拽的组件 ID
     */
    setDragOffset: (offset: { x: number; y: number } | null, componentId: string | null) => {
      set(state => {
        state.dragOffset = offset;
        state.draggingComponentId = componentId;
      });
    },
  }))
);
