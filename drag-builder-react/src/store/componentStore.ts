/**
 * 组件树状态 Store
 * 管理所有组件节点、选中状态、CRUD 操作
 *
 * 使用 Zustand + Immer 中间件确保不可变更新
 * 组件使用扁平化存储（避免深层嵌套）
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ComponentNode } from '../types';

/**
 * 历史记录快照（用于撤销/重做）
 */
interface HistorySnapshot {
  components: ComponentNode[];
}

/**
 * 组件树状态接口
 */
interface ComponentStore {
  // 状态
  components: ComponentNode[];
  selectedId: string | null;
  selectedIds: string[]; // 多选组件 ID 列表

  // 历史记录（撤销/重做）
  history: HistorySnapshot[];
  historyIndex: number;
  clipboard: ComponentNode[]; // 剪贴板（复制的组件）

  // 查询方法
  getComponentById: (id: string) => ComponentNode | undefined;
  getSelectedComponent: () => ComponentNode | undefined;
  getSelectedComponents: () => ComponentNode[]; // 获取所有选中的组件

  // 操作方法
  addComponent: (component: ComponentNode) => void;
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  toggleSelectComponent: (id: string) => void; // Ctrl + 点击切换选中
  clearSelection: () => void; // 清除所有选中

  // 批量操作
  updateMultipleComponents: (ids: string[], updates: Partial<ComponentNode>) => void;
  moveMultipleComponents: (ids: string[], deltaX: number, deltaY: number) => void;

  // 层级操作
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;

  // 批量操作
  clearAll: () => void;
  importComponents: (components: ComponentNode[]) => void;

  // 历史记录操作
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // 剪贴板操作
  copySelected: () => void;
  pasteComponents: () => void;
  deleteSelected: () => void;
}

/**
 * 创建组件树状态 Store
 *
 * 需求：3.4, 4.1, 8.2, 8.3, 8.4, 8.5
 * - 3.4: 从物料库拖拽组件到画布创建新组件
 * - 4.1: 点击组件选中
 * - 8.2: 置于顶层
 * - 8.3: 上移一层
 * - 8.4: 下移一层
 * - 8.5: 置于底层
 */
export const useComponentStore = create<ComponentStore>()(
  immer((set, get) => ({
    // 初始状态
    components: [],
    selectedId: null,
    selectedIds: [],
    history: [],
    historyIndex: -1,
    clipboard: [],

    /**
     * 根据 ID 查询组件
     * @param id 组件 ID
     * @returns 组件节点或 undefined
     */
    getComponentById: (id: string) => {
      return get().components.find(comp => comp.id === id);
    },

    /**
     * 获取当前选中的组件（单选模式）
     * @returns 选中的组件节点或 undefined
     */
    getSelectedComponent: () => {
      const { selectedId, components } = get();
      if (!selectedId) return undefined;
      return components.find(comp => comp.id === selectedId);
    },

    /**
     * 获取所有选中的组件（多选模式）
     * @returns 选中的组件节点数组
     */
    getSelectedComponents: () => {
      const { selectedIds, components } = get();
      return components.filter(comp => selectedIds.includes(comp.id));
    },

    /**
     * 添加新组件到画布
     * @param component 新组件节点
     */
    addComponent: (component: ComponentNode) => {
      // 先推入历史记录
      get().pushHistory();
      set(state => {
        // 确保 zIndex 非负（需求 8.6）
        const sanitizedComponent = {
          ...component,
          position: {
            ...component.position,
            zIndex: Math.max(0, component.position.zIndex),
          },
        };
        state.components.push(sanitizedComponent);
        // 自动选中新添加的组件（单选模式）
        state.selectedId = sanitizedComponent.id;
        state.selectedIds = [sanitizedComponent.id];
      });
    },

    /**
     * 更新组件属性
     * 支持部分更新（深度合并）
     * @param id 组件 ID
     * @param updates 要更新的属性
     */
    updateComponent: (id: string, updates: Partial<ComponentNode>) => {
      set(state => {
        const index = state.components.findIndex(comp => comp.id === id);
        if (index !== -1) {
          // 深度合并更新
          const component = state.components[index];

          // 更新 position（如果提供）
          if (updates.position) {
            component.position = {
              ...component.position,
              ...updates.position,
            };
          }

          // 更新 styles（如果提供）
          if (updates.styles) {
            component.styles = {
              ...component.styles,
              ...updates.styles,
            };
          }

          // 更新 content（如果提供）
          if (updates.content) {
            component.content = {
              ...component.content,
              ...updates.content,
            };
          }

          // 更新其他顶层属性
          if (updates.type !== undefined) component.type = updates.type;
          // 使用 'in' 操作符检查属性是否存在，因为 undefined 是有效的更新值（用于清除 animation）
          if ('animation' in updates) component.animation = updates.animation;
          if (updates.children !== undefined) component.children = updates.children;
        }
      });
    },

    /**
     * 删除组件
     * 如果删除的是选中组件，则清除选中状态
     * @param id 组件 ID
     */
    deleteComponent: (id: string) => {
      // 先推入历史记录
      get().pushHistory();
      set(state => {
        state.components = state.components.filter(comp => comp.id !== id);
        // 如果删除的是选中组件，清除选中状态
        if (state.selectedId === id) {
          state.selectedId = null;
        }
      });
    },

    /**
     * 选中组件（单选模式）
     * @param id 组件 ID，传入 null 取消选中
     */
    selectComponent: (id: string | null) => {
      set(state => {
        state.selectedId = id;
        // 单选时清空多选列表，或设置为单个元素
        state.selectedIds = id ? [id] : [];
      });
    },

    /**
     * 切换选中组件（多选模式，Ctrl + 点击）
     * @param id 组件 ID
     */
    toggleSelectComponent: (id: string) => {
      set(state => {
        const index = state.selectedIds.indexOf(id);
        if (index > -1) {
          // 已选中，取消选中
          state.selectedIds.splice(index, 1);
        } else {
          // 未选中，添加到选中列表
          state.selectedIds.push(id);
        }

        // 更新 selectedId 为最后一个选中的组件
        state.selectedId =
          state.selectedIds.length > 0 ? state.selectedIds[state.selectedIds.length - 1] : null;
      });
    },

    /**
     * 清除所有选中
     */
    clearSelection: () => {
      set(state => {
        state.selectedId = null;
        state.selectedIds = [];
      });
    },

    /**
     * 批量更新多个组件
     * @param ids 组件 ID 列表
     * @param updates 要更新的属性
     */
    updateMultipleComponents: (ids: string[], updates: Partial<ComponentNode>) => {
      set(state => {
        ids.forEach(id => {
          const index = state.components.findIndex(comp => comp.id === id);
          if (index !== -1) {
            const component = state.components[index];

            // 更新 position（如果提供）
            if (updates.position) {
              component.position = {
                ...component.position,
                ...updates.position,
              };
            }

            // 更新 styles（如果提供）
            if (updates.styles) {
              component.styles = {
                ...component.styles,
                ...updates.styles,
              };
            }

            // 更新 content（如果提供）
            if (updates.content) {
              component.content = {
                ...component.content,
                ...updates.content,
              };
            }
          }
        });
      });
    },

    /**
     * 批量移动多个组件
     * @param ids 组件 ID 列表
     * @param deltaX X 轴偏移量
     * @param deltaY Y 轴偏移量
     */
    moveMultipleComponents: (ids: string[], deltaX: number, deltaY: number) => {
      set(state => {
        ids.forEach(id => {
          const component = state.components.find(comp => comp.id === id);
          if (component) {
            component.position.x += deltaX;
            component.position.y += deltaY;
          }
        });
      });
    },

    /**
     * 置于顶层
     * 将组件的 zIndex 设置为当前最大值 + 1
     * 限制最大值为 999
     * @param id 组件 ID
     */
    bringToFront: (id: string) => {
      set(state => {
        const component = state.components.find(comp => comp.id === id);
        if (component) {
          // 找到当前最大的 zIndex
          const maxZIndex = Math.max(0, ...state.components.map(comp => comp.position.zIndex));
          // 限制最大值为 999
          component.position.zIndex = Math.min(999, maxZIndex + 1);
        }
      });
    },

    /**
     * 置于底层
     * 将组件的 zIndex 设置为 0
     * @param id 组件 ID
     */
    sendToBack: (id: string) => {
      set(state => {
        const component = state.components.find(comp => comp.id === id);
        if (component) {
          component.position.zIndex = 0;
        }
      });
    },

    /**
     * 上移一层
     * 将组件的 zIndex 增加 1
     * 限制最大值为 999
     * @param id 组件 ID
     */
    moveUp: (id: string) => {
      set(state => {
        const component = state.components.find(comp => comp.id === id);
        if (component) {
          component.position.zIndex = Math.min(999, component.position.zIndex + 1);
        }
      });
    },

    /**
     * 下移一层
     * 将组件的 zIndex 减少 1（但不小于 0）
     * @param id 组件 ID
     */
    moveDown: (id: string) => {
      set(state => {
        const component = state.components.find(comp => comp.id === id);
        if (component) {
          component.position.zIndex = Math.max(0, component.position.zIndex - 1);
        }
      });
    },

    /**
     * 清空所有组件
     * 同时清除选中状态
     */
    clearAll: () => {
      set(state => {
        state.components = [];
        state.selectedId = null;
        state.selectedIds = [];
      });
    },

    /**
     * 导入组件列表
     * 用于加载项目时恢复组件树
     * @param components 组件列表
     */
    importComponents: (components: ComponentNode[]) => {
      set(state => {
        state.components = components;
        state.selectedId = null;
        state.selectedIds = [];
        // 导入时重置历史记录
        state.history = [];
        state.historyIndex = -1;
      });
    },

    /**
     * 将当前状态推入历史记录
     * 在每次修改组件前调用，用于支持撤销
     * 最多保留 50 条历史记录
     */
    pushHistory: () => {
      set(state => {
        const snapshot: HistorySnapshot = {
          components: JSON.parse(JSON.stringify(state.components)),
        };
        // 如果当前不在历史末尾，截断后续历史（新操作会覆盖重做历史）
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(snapshot);
        // 最多保留 50 条
        if (newHistory.length > 50) {
          newHistory.shift();
        }
        state.history = newHistory;
        state.historyIndex = newHistory.length - 1;
      });
    },

    /**
     * 撤销（Ctrl+Z）
     * 恢复到上一个历史快照
     */
    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex <= 0) return;

      set(state => {
        state.historyIndex = historyIndex - 1;
        const snapshot = history[historyIndex - 1];
        state.components = JSON.parse(JSON.stringify(snapshot.components));
        state.selectedId = null;
        state.selectedIds = [];
      });
    },

    /**
     * 重做（Ctrl+Shift+Z）
     * 恢复到下一个历史快照
     */
    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;

      set(state => {
        state.historyIndex = historyIndex + 1;
        const snapshot = history[historyIndex + 1];
        state.components = JSON.parse(JSON.stringify(snapshot.components));
        state.selectedId = null;
        state.selectedIds = [];
      });
    },

    /**
     * 复制选中的组件到剪贴板（Ctrl+C）
     */
    copySelected: () => {
      const { selectedIds, components } = get();
      if (selectedIds.length === 0) return;

      const selected = components.filter(c => selectedIds.includes(c.id));
      set(state => {
        state.clipboard = JSON.parse(JSON.stringify(selected));
      });
    },

    /**
     * 粘贴剪贴板中的组件（Ctrl+V）
     * 粘贴时偏移 20px 以区分原组件
     */
    pasteComponents: () => {
      const { clipboard } = get();
      if (clipboard.length === 0) return;

      // 先推入历史记录
      get().pushHistory();

      set(state => {
        const newIds: string[] = [];
        const newComponents: ComponentNode[] = [];

        clipboard.forEach(comp => {
          const newId = crypto.randomUUID();
          const newComp: ComponentNode = {
            ...JSON.parse(JSON.stringify(comp)),
            id: newId,
            position: {
              ...comp.position,
              x: comp.position.x + 20,
              y: comp.position.y + 20,
            },
          };
          newComponents.push(newComp);
          newIds.push(newId);
        });

        // 选中粘贴的组件
        state.selectedIds = newIds;
        state.selectedId = newIds[newIds.length - 1] ?? null;

        // 将新组件添加到画布
        state.components.push(...newComponents);

        // 更新剪贴板偏移，支持连续粘贴
        // 注意：必须创建新数组而非修改现有数组
        state.clipboard = clipboard.map(comp => ({
          ...comp,
          position: {
            ...comp.position,
            x: comp.position.x + 20,
            y: comp.position.y + 20,
          },
        }));
      });
    },

    /**
     * 删除选中的组件（Delete/Backspace）
     */
    deleteSelected: () => {
      const { selectedIds } = get();
      if (selectedIds.length === 0) return;

      // 先推入历史记录
      get().pushHistory();

      set(state => {
        state.components = state.components.filter(c => !selectedIds.includes(c.id));
        state.selectedId = null;
        state.selectedIds = [];
      });
    },
  }))
);
