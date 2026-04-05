/**
 * 集成测试 1：拖拽 → 创建 → 编辑流程
 *
 * 测试多个模块之间的协作：
 * - componentStore（组件状态管理）
 * - createDefaultComponent（物料库默认组件创建）
 * - 属性编辑（位置、样式、内容）
 *
 * 需求：3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 7.5, 7.6, 7.7
 *
 * 注意：由于 @dnd-kit 的拖拽在 jsdom 中难以模拟，
 * 直接调用 store 的 addComponent 方法来模拟"拖拽创建"的结果
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useComponentStore } from '../../src/store/componentStore';
import { createDefaultComponent } from '../../src/components/MaterialPanel/materialConfig';
import type { ComponentNode } from '../../src/types';

// ============================================================
// 辅助函数
// ============================================================

/**
 * 重置 componentStore 状态
 */
function resetStore() {
  useComponentStore.getState().clearAll();
}

// ============================================================
// 测试套件：拖拽 → 创建 → 编辑集成流程
// ============================================================

describe('集成测试：拖拽 → 创建 → 编辑流程', () => {
  // 每个测试前重置 store 状态，确保测试独立性
  beforeEach(() => {
    resetStore();
  });

  // ============================================================
  // 场景 1：从物料库拖拽组件到画布后，组件被正确创建并添加到 store
  // ============================================================

  describe('场景 1：拖拽创建组件（需求 3.4, 3.5, 3.6, 3.7, 3.8）', () => {
    it('拖拽 div 组件到画布后，store 中应包含该组件', () => {
      const store = useComponentStore.getState();

      // 模拟从物料库拖拽 div 组件到画布坐标 (100, 150)
      const newComponent = createDefaultComponent('div', { x: 100, y: 150 });
      store.addComponent(newComponent);

      // 验证组件已添加到 store
      const state = useComponentStore.getState();
      expect(state.components).toHaveLength(1);
      expect(state.components[0].type).toBe('div');
      expect(state.components[0].position.x).toBe(100);
      expect(state.components[0].position.y).toBe(150);
    });

    it('拖拽 button 组件到画布后，store 中应包含该组件', () => {
      const store = useComponentStore.getState();

      // 模拟从物料库拖拽 button 组件到画布坐标 (200, 300)
      const newComponent = createDefaultComponent('button', { x: 200, y: 300 });
      store.addComponent(newComponent);

      const state = useComponentStore.getState();
      expect(state.components).toHaveLength(1);
      expect(state.components[0].type).toBe('button');
      expect(state.components[0].position.x).toBe(200);
      expect(state.components[0].position.y).toBe(300);
    });

    it('拖拽 text 组件到画布后，store 中应包含该组件', () => {
      const store = useComponentStore.getState();

      const newComponent = createDefaultComponent('text', { x: 50, y: 80 });
      store.addComponent(newComponent);

      const state = useComponentStore.getState();
      expect(state.components).toHaveLength(1);
      expect(state.components[0].type).toBe('text');
    });

    it('拖拽 image 组件到画布后，store 中应包含该组件', () => {
      const store = useComponentStore.getState();

      const newComponent = createDefaultComponent('image', { x: 0, y: 0 });
      store.addComponent(newComponent);

      const state = useComponentStore.getState();
      expect(state.components).toHaveLength(1);
      expect(state.components[0].type).toBe('image');
    });

    it('拖拽 input 组件到画布后，store 中应包含该组件', () => {
      const store = useComponentStore.getState();

      const newComponent = createDefaultComponent('input', { x: 300, y: 400 });
      store.addComponent(newComponent);

      const state = useComponentStore.getState();
      expect(state.components).toHaveLength(1);
      expect(state.components[0].type).toBe('input');
    });

    it('拖拽组件后，组件应被自动选中（需求 3.8）', () => {
      const store = useComponentStore.getState();

      const newComponent = createDefaultComponent('div', { x: 100, y: 100 });
      store.addComponent(newComponent);

      const state = useComponentStore.getState();
      // 验证新组件被自动选中
      expect(state.selectedId).toBe(newComponent.id);
    });

    it('拖拽组件后，组件应分配唯一 UUID（需求 3.7）', () => {
      const store = useComponentStore.getState();

      // 创建多个组件
      const comp1 = createDefaultComponent('div', { x: 0, y: 0 });
      const comp2 = createDefaultComponent('button', { x: 100, y: 100 });
      const comp3 = createDefaultComponent('text', { x: 200, y: 200 });

      store.addComponent(comp1);
      store.addComponent(comp2);
      store.addComponent(comp3);

      // 验证所有 ID 唯一
      const ids = [comp1.id, comp2.id, comp3.id];
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);

      // 验证 UUID v4 格式
      const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      ids.forEach(id => {
        expect(uuidv4Regex.test(id)).toBe(true);
      });
    });

    it('拖拽 div 组件后，应应用正确的默认样式（需求 3.6）', () => {
      const store = useComponentStore.getState();

      const newComponent = createDefaultComponent('div', { x: 0, y: 0 });
      store.addComponent(newComponent);

      const state = useComponentStore.getState();
      const comp = state.components[0];

      // 验证 div 默认样式：200x100px, 边框 1px slate-200, 圆角 16px
      expect(comp.position.width).toBe(200);
      expect(comp.position.height).toBe(100);
      expect(comp.styles.borderColor).toBe('#E2E8F0');
      expect(comp.styles.borderWidth).toBe(1);
      expect(comp.styles.borderRadius).toBe(16);
    });

    it('拖拽 button 组件后，应应用正确的默认样式（需求 3.6）', () => {
      const store = useComponentStore.getState();

      const newComponent = createDefaultComponent('button', { x: 0, y: 0 });
      store.addComponent(newComponent);

      const state = useComponentStore.getState();
      const comp = state.components[0];

      // 验证 button 默认样式：120x40px, 背景 #C2410C, 文字白色, 圆角 8px
      expect(comp.position.width).toBe(120);
      expect(comp.position.height).toBe(40);
      expect(comp.styles.backgroundColor).toBe('#C2410C');
      expect(comp.styles.textColor).toBe('#FFFFFF');
      expect(comp.styles.borderRadius).toBe(8);
    });

    it('拖拽 text 组件后，应应用正确的默认样式（需求 3.6）', () => {
      const store = useComponentStore.getState();

      const newComponent = createDefaultComponent('text', { x: 0, y: 0 });
      store.addComponent(newComponent);

      const state = useComponentStore.getState();
      const comp = state.components[0];

      // 验证 text 默认样式：字体 16px, 颜色 slate-900
      expect(comp.styles.textColor).toBe('#0F172A');
      expect(comp.styles.fontSize).toBe(16);
      expect(comp.content.text).toBe('文本内容');
    });

    it('拖拽 image 组件后，应应用正确的默认样式（需求 3.6）', () => {
      const store = useComponentStore.getState();

      const newComponent = createDefaultComponent('image', { x: 0, y: 0 });
      store.addComponent(newComponent);

      const state = useComponentStore.getState();
      const comp = state.components[0];

      // 验证 image 默认样式：200x200px, 占位符灰色背景
      expect(comp.position.width).toBe(200);
      expect(comp.position.height).toBe(200);
      expect(comp.styles.backgroundColor).toBe('#F1F5F9');
    });

    it('拖拽 input 组件后，应应用正确的默认样式（需求 3.6）', () => {
      const store = useComponentStore.getState();

      const newComponent = createDefaultComponent('input', { x: 0, y: 0 });
      store.addComponent(newComponent);

      const state = useComponentStore.getState();
      const comp = state.components[0];

      // 验证 input 默认样式：240x40px, 边框 1px slate-200, 圆角 8px
      expect(comp.position.width).toBe(240);
      expect(comp.position.height).toBe(40);
      expect(comp.styles.borderColor).toBe('#E2E8F0');
      expect(comp.styles.borderWidth).toBe(1);
      expect(comp.content.placeholder).toBe('请输入内容');
    });
  });

  // ============================================================
  // 场景 2：组件被选中后，可以通过属性面板编辑属性
  // ============================================================

  describe('场景 2：选中组件（需求 4.1）', () => {
    it('点击组件后，selectedId 应更新为该组件的 ID', () => {
      const store = useComponentStore.getState();

      // 创建两个组件
      const comp1 = createDefaultComponent('div', { x: 0, y: 0 });
      const comp2 = createDefaultComponent('button', { x: 100, y: 100 });
      store.addComponent(comp1);
      store.addComponent(comp2);

      // 选中第一个组件
      useComponentStore.getState().selectComponent(comp1.id);

      expect(useComponentStore.getState().selectedId).toBe(comp1.id);
    });

    it('点击画布空白区域后，selectedId 应为 null（需求 4.6）', () => {
      const store = useComponentStore.getState();

      const comp = createDefaultComponent('div', { x: 0, y: 0 });
      store.addComponent(comp);

      // 先选中组件
      useComponentStore.getState().selectComponent(comp.id);
      expect(useComponentStore.getState().selectedId).toBe(comp.id);

      // 取消选中（模拟点击空白区域）
      useComponentStore.getState().selectComponent(null);
      expect(useComponentStore.getState().selectedId).toBeNull();
    });

    it('getSelectedComponent 应返回当前选中的组件', () => {
      const store = useComponentStore.getState();

      const comp = createDefaultComponent('text', { x: 50, y: 50 });
      store.addComponent(comp);

      useComponentStore.getState().selectComponent(comp.id);

      const selected = useComponentStore.getState().getSelectedComponent();
      expect(selected).toBeDefined();
      expect(selected?.id).toBe(comp.id);
      expect(selected?.type).toBe('text');
    });
  });

  // ============================================================
  // 场景 3：编辑组件属性（位置、样式、内容）
  // ============================================================

  describe('场景 3：编辑组件属性（需求 7.5, 7.6, 7.7）', () => {
    it('修改组件位置后，store 中的位置应实时更新', () => {
      const store = useComponentStore.getState();

      const comp = createDefaultComponent('div', { x: 100, y: 100 });
      store.addComponent(comp);

      // 编辑位置
      useComponentStore.getState().updateComponent(comp.id, {
        position: {
          ...comp.position,
          x: 250,
          y: 350,
        },
      });

      const updated = useComponentStore.getState().getComponentById(comp.id);
      expect(updated?.position.x).toBe(250);
      expect(updated?.position.y).toBe(350);
    });

    it('修改组件尺寸后，store 中的尺寸应实时更新', () => {
      const store = useComponentStore.getState();

      const comp = createDefaultComponent('div', { x: 0, y: 0 });
      store.addComponent(comp);

      // 编辑尺寸
      useComponentStore.getState().updateComponent(comp.id, {
        position: {
          ...comp.position,
          width: 400,
          height: 200,
        },
      });

      const updated = useComponentStore.getState().getComponentById(comp.id);
      expect(updated?.position.width).toBe(400);
      expect(updated?.position.height).toBe(200);
    });

    it('修改组件背景色后，store 中的样式应实时更新', () => {
      const store = useComponentStore.getState();

      const comp = createDefaultComponent('div', { x: 0, y: 0 });
      store.addComponent(comp);

      // 编辑背景色
      useComponentStore.getState().updateComponent(comp.id, {
        styles: {
          ...comp.styles,
          backgroundColor: '#FF0000',
        },
      });

      const updated = useComponentStore.getState().getComponentById(comp.id);
      expect(updated?.styles.backgroundColor).toBe('#FF0000');
    });

    it('修改 button 组件文本内容后，store 中的内容应实时更新', () => {
      const store = useComponentStore.getState();

      const comp = createDefaultComponent('button', { x: 0, y: 0 });
      store.addComponent(comp);

      // 编辑文本内容
      useComponentStore.getState().updateComponent(comp.id, {
        content: {
          ...comp.content,
          text: '新按钮文字',
        },
      });

      const updated = useComponentStore.getState().getComponentById(comp.id);
      expect(updated?.content.text).toBe('新按钮文字');
    });

    it('修改 image 组件 URL 后，store 中的内容应实时更新', () => {
      const store = useComponentStore.getState();

      const comp = createDefaultComponent('image', { x: 0, y: 0 });
      store.addComponent(comp);

      // 编辑图片 URL
      useComponentStore.getState().updateComponent(comp.id, {
        content: {
          ...comp.content,
          src: 'https://example.com/new-image.jpg',
        },
      });

      const updated = useComponentStore.getState().getComponentById(comp.id);
      expect(updated?.content.src).toBe('https://example.com/new-image.jpg');
    });

    it('修改 input 组件占位符后，store 中的内容应实时更新', () => {
      const store = useComponentStore.getState();

      const comp = createDefaultComponent('input', { x: 0, y: 0 });
      store.addComponent(comp);

      // 编辑占位符
      useComponentStore.getState().updateComponent(comp.id, {
        content: {
          ...comp.content,
          placeholder: '请输入邮箱地址',
        },
      });

      const updated = useComponentStore.getState().getComponentById(comp.id);
      expect(updated?.content.placeholder).toBe('请输入邮箱地址');
    });

    it('修改属性后，选中状态应保持不变', () => {
      const store = useComponentStore.getState();

      const comp = createDefaultComponent('div', { x: 0, y: 0 });
      store.addComponent(comp);

      // 确认已选中
      expect(useComponentStore.getState().selectedId).toBe(comp.id);

      // 修改属性
      useComponentStore.getState().updateComponent(comp.id, {
        position: { ...comp.position, x: 999 },
      });

      // 选中状态应保持不变
      expect(useComponentStore.getState().selectedId).toBe(comp.id);
    });
  });

  // ============================================================
  // 场景 4：完整的拖拽 → 创建 → 编辑流程
  // ============================================================

  describe('场景 4：完整流程集成验证', () => {
    it('完整流程：拖拽创建 → 自动选中 → 编辑属性 → 验证更新', () => {
      const store = useComponentStore.getState();

      // 步骤 1：从物料库拖拽 div 组件到画布
      const newComponent = createDefaultComponent('div', { x: 100, y: 200 });
      store.addComponent(newComponent);

      // 步骤 2：验证组件被创建并添加到 store
      let state = useComponentStore.getState();
      expect(state.components).toHaveLength(1);
      expect(state.components[0].type).toBe('div');

      // 步骤 3：验证组件被自动选中
      expect(state.selectedId).toBe(newComponent.id);

      // 步骤 4：编辑组件位置
      useComponentStore.getState().updateComponent(newComponent.id, {
        position: { ...newComponent.position, x: 300, y: 400 },
      });

      // 步骤 5：验证位置更新实时反映
      state = useComponentStore.getState();
      const updatedComp = state.getComponentById(newComponent.id);
      expect(updatedComp?.position.x).toBe(300);
      expect(updatedComp?.position.y).toBe(400);

      // 步骤 6：编辑组件样式
      useComponentStore.getState().updateComponent(newComponent.id, {
        styles: { ...newComponent.styles, backgroundColor: '#3B82F6' },
      });

      // 步骤 7：验证样式更新实时反映
      state = useComponentStore.getState();
      const styledComp = state.getComponentById(newComponent.id);
      expect(styledComp?.styles.backgroundColor).toBe('#3B82F6');

      // 步骤 8：选中状态始终保持
      expect(state.selectedId).toBe(newComponent.id);
    });

    it('多组件场景：拖拽多个组件后，每个组件独立编辑', () => {
      const store = useComponentStore.getState();

      // 拖拽三个不同类型的组件
      const divComp = createDefaultComponent('div', { x: 0, y: 0 });
      const btnComp = createDefaultComponent('button', { x: 100, y: 100 });
      const textComp = createDefaultComponent('text', { x: 200, y: 200 });

      store.addComponent(divComp);
      store.addComponent(btnComp);
      store.addComponent(textComp);

      // 验证三个组件都在 store 中
      expect(useComponentStore.getState().components).toHaveLength(3);

      // 独立编辑每个组件
      useComponentStore.getState().updateComponent(divComp.id, {
        styles: { ...divComp.styles, backgroundColor: '#FF0000' },
      });
      useComponentStore.getState().updateComponent(btnComp.id, {
        content: { ...btnComp.content, text: '新按钮' },
      });
      useComponentStore.getState().updateComponent(textComp.id, {
        content: { ...textComp.content, text: '新文本' },
      });

      // 验证每个组件的修改互不影响
      const state = useComponentStore.getState();
      expect(state.getComponentById(divComp.id)?.styles.backgroundColor).toBe('#FF0000');
      expect(state.getComponentById(btnComp.id)?.content.text).toBe('新按钮');
      expect(state.getComponentById(textComp.id)?.content.text).toBe('新文本');
    });

    it('删除组件后，store 中应移除该组件且选中状态清除', () => {
      const store = useComponentStore.getState();

      const comp = createDefaultComponent('div', { x: 0, y: 0 });
      store.addComponent(comp);

      // 确认已添加并选中
      expect(useComponentStore.getState().components).toHaveLength(1);
      expect(useComponentStore.getState().selectedId).toBe(comp.id);

      // 删除组件
      useComponentStore.getState().deleteComponent(comp.id);

      // 验证组件已删除，选中状态已清除
      expect(useComponentStore.getState().components).toHaveLength(0);
      expect(useComponentStore.getState().selectedId).toBeNull();
    });

    it('层级操作：置于顶层后 zIndex 应增加', () => {
      const store = useComponentStore.getState();

      // 创建两个组件
      const comp1 = createDefaultComponent('div', { x: 0, y: 0 });
      const comp2 = createDefaultComponent('button', { x: 50, y: 50 });
      store.addComponent(comp1);
      store.addComponent(comp2);

      // 获取 comp1 的初始 zIndex
      const initialZIndex = useComponentStore.getState().getComponentById(comp1.id)?.position.zIndex ?? 0;

      // 将 comp1 置于顶层
      useComponentStore.getState().bringToFront(comp1.id);

      // 验证 zIndex 增加
      const newZIndex = useComponentStore.getState().getComponentById(comp1.id)?.position.zIndex ?? 0;
      expect(newZIndex).toBeGreaterThan(initialZIndex);
    });

    it('撤销操作：添加组件后撤销，组件应被移除', () => {
      const store = useComponentStore.getState();

      // 添加组件（addComponent 内部会调用 pushHistory）
      const comp = createDefaultComponent('div', { x: 0, y: 0 });
      store.addComponent(comp);

      expect(useComponentStore.getState().components).toHaveLength(1);

      // 撤销
      useComponentStore.getState().undo();

      // 验证组件被移除
      expect(useComponentStore.getState().components).toHaveLength(0);
    });
  });
});
