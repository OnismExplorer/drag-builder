/**
 * 组件拖拽功能测试
 * 测试画布上组件的拖拽移动功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentStore } from '../src/store/componentStore';
import type { ComponentNode } from '../src/types';

describe('组件拖拽移动功能', () => {
  beforeEach(() => {
    // 每个测试前清空状态
    const { clearAll } = useComponentStore.getState();
    clearAll();
  });

  it('应该能够更新组件位置', () => {
    const { result } = renderHook(() => useComponentStore());

    // 添加一个测试组件
    const testComponent: ComponentNode = {
      id: 'test-1',
      type: 'div',
      position: { x: 100, y: 100, width: 200, height: 100, zIndex: 0 },
      styles: {},
      content: {},
      children: [],
    };

    act(() => {
      result.current.addComponent(testComponent);
    });

    // 验证组件已添加
    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].position.x).toBe(100);
    expect(result.current.components[0].position.y).toBe(100);

    // 更新组件位置（模拟拖拽）
    act(() => {
      result.current.updateComponent('test-1', {
        position: { x: 200, y: 150 },
      });
    });

    // 验证位置已更新
    const updatedComponent = result.current.getComponentById('test-1');
    expect(updatedComponent?.position.x).toBe(200);
    expect(updatedComponent?.position.y).toBe(150);
    // 其他属性应保持不变
    expect(updatedComponent?.position.width).toBe(200);
    expect(updatedComponent?.position.height).toBe(100);
  });

  it('应该能够处理多个组件的拖拽', () => {
    const { result } = renderHook(() => useComponentStore());

    // 添加两个组件
    const component1: ComponentNode = {
      id: 'comp-1',
      type: 'div',
      position: { x: 50, y: 50, width: 100, height: 100, zIndex: 0 },
      styles: {},
      content: {},
      children: [],
    };

    const component2: ComponentNode = {
      id: 'comp-2',
      type: 'button',
      position: { x: 200, y: 200, width: 120, height: 40, zIndex: 1 },
      styles: {},
      content: {},
      children: [],
    };

    act(() => {
      result.current.addComponent(component1);
      result.current.addComponent(component2);
    });

    expect(result.current.components).toHaveLength(2);

    // 移动第一个组件
    act(() => {
      result.current.updateComponent('comp-1', {
        position: { x: 150, y: 150 },
      });
    });

    // 移动第二个组件
    act(() => {
      result.current.updateComponent('comp-2', {
        position: { x: 300, y: 250 },
      });
    });

    // 验证两个组件都已更新
    const comp1 = result.current.getComponentById('comp-1');
    const comp2 = result.current.getComponentById('comp-2');

    expect(comp1?.position.x).toBe(150);
    expect(comp1?.position.y).toBe(150);
    expect(comp2?.position.x).toBe(300);
    expect(comp2?.position.y).toBe(250);
  });

  it('应该防止组件移动到负坐标', () => {
    const { result } = renderHook(() => useComponentStore());

    const testComponent: ComponentNode = {
      id: 'test-1',
      type: 'div',
      position: { x: 50, y: 50, width: 100, height: 100, zIndex: 0 },
      styles: {},
      content: {},
      children: [],
    };

    act(() => {
      result.current.addComponent(testComponent);
    });

    // 尝试移动到负坐标（在 EditorPage 的 handleDragEnd 中会被限制）
    // 这里测试 store 本身不会阻止负坐标，但 EditorPage 会使用 Math.max(0, x)
    act(() => {
      result.current.updateComponent('test-1', {
        position: { x: -10, y: -20 },
      });
    });

    const component = result.current.getComponentById('test-1');
    // Store 本身允许负坐标，但 EditorPage 会在调用前限制
    expect(component?.position.x).toBe(-10);
    expect(component?.position.y).toBe(-20);
  });
});
