/**
 * 集成测试 1：拖拽 → 创建 → 编辑流程
 *
 * 测试多个模块之间的协作：
 * - componentStore（组件状态管理）
 * - createDefaultComponent（物料库默认组件创建）
 * - 属性编辑（位置、样式、内容）
 *
 * 注意：由于 @dnd-kit 的拖拽在 jsdom 中难以模拟，
 * 直接调用 store 的 addComponent 方法来模拟"拖拽创建"的结果
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useComponentStore } from '../src/store/componentStore';
import { createDefaultComponent } from '../src/components/MaterialPanel';

// ============================================================
// 测试套件：拖拽 → 创建 → 编辑集成流程
// ============================================================

describe('集成测试：拖拽 → 创建 → 编辑流程', () => {
  // 每个测试前重置 store 状态，确保测试独立性
  beforeEach(() => {
    useComponentStore.getState().clearAll();
  });

  // ============================================================
  // 场景 1：从物料库拖拽组件到画布后，组件被正确创建并添加到 store
  // ============================================================

  describe('场景 1：拖拽创建组件', () => {
    it('拖拽 div 组件到画布后，store 中应包含该组件', () => {
      const { result } = renderHook(() => useComponentStore());

      // 模拟从物料库拖拽 div 组件到画布坐标 (100, 150)
      const newComponent = createDefaultComponent('div', { x: 100, y: 150 });

      act(() => {
        result.current.addComponent(newComponent);
      });

      // 验证组件已添加到 store
      expect(result.current.components).toHaveLength(1);
      expect(result.current.components[0].type).toBe('div');
      expect(result.current.components[0].position.x).toBe(100);
      expect(result.current.components[0].position.y).toBe(150);
    });

    it('拖拽 button 组件到画布后，store 中应包含该组件', () => {
      const { result } = renderHook(() => useComponentStore());

      // 模拟从物料库拖拽 button 组件到画布坐标 (200, 300)
      const newComponent = createDefaultComponent('button', { x: 200, y: 300 });

      act(() => {
        result.current.addComponent(newComponent);
      });

      // 验证组件类型和位置
      expect(result.current.components).toHaveLength(1);
      expect(result.current.components[0].type).toBe('button');
      expect(result.current.components[0].position.x).toBe(200);
      expect(result.current.components[0].position.y).toBe(300);
    });

    it('拖拽 text 组件到画布后，store 中应包含该组件', () => {
      const { result } = renderHook(() => useComponentStore());

      // 模拟从物料库拖拽 text 组件
      const newComponent = createDefaultComponent('text', { x: 50, y: 80 });

      act(() => {
        result.current.addComponent(newComponent);
      });

      expect(result.current.components).toHaveLength(1);
      expect(result.current.components[0].type).toBe('text');
    });

    it('拖拽 image 组件到画布后，store 中应包含该组件', () => {
      const { result } = renderHook(() => useComponentStore());

      const newComponent = createDefaultComponent('image', { x: 0, y: 0 });

      act(() => {
        result.current.addComponent(newComponent);
      });

      expect(result.current.components).toHaveLength(1);
      expect(result.current.components[0].type).toBe('image');
    });

    it('拖拽 input 组件到画布后，store 中应包含该组件', () => {
   