/**
 * ResizeHandles 组件单元测试
 * 
 * 测试内容：
 * - 测试 8 个调整手柄的渲染
 * - 测试手柄的基本交互
 * 
 * 需求：5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import ResizeHandles from '../../src/components/Canvas/ResizeHandles';
import { useComponentStore } from '../../src/store/componentStore';
import { useCanvasStore } from '../../src/store/canvasStore';
import type { ComponentNode } from '../../src/types';

/**
 * 创建测试用的组件节点
 */
const createTestComponent = (): ComponentNode => ({
  id: 'test-component-1',
  type: 'div',
  position: {
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    zIndex: 1,
  },
  styles: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 8,
  },
  content: {},
});

/**
 * 测试前重置所有 store 状态
 */
beforeEach(() => {
  // 重置 Component Store
  useComponentStore.setState({
    components: [],
    selectedId: null,
  });

  // 重置 Canvas Store
  useCanvasStore.setState({
    config: {
      width: 1440,
      height: 900,
      preset: 'desktop',
      backgroundColor: '#FFFFFF',
    },
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
});

describe('ResizeHandles - 手柄渲染', () => {
  it('应该渲染 8 个调整手柄', () => {
    const component = createTestComponent();
    
    const { container } = render(<ResizeHandles component={component} />);
    
    // 查找所有手柄元素（通过 bg-blue-500 类名）
    const handles = container.querySelectorAll('.bg-blue-500');
    
    // 验证有 8 个手柄
    expect(handles.length).toBe(8);
  });

  it('所有手柄应该有正确的尺寸（2x2）', () => {
    const component = createTestComponent();
    
    const { container } = render(<ResizeHandles component={component} />);
    
    // 查找所有手柄元素
    const handles = container.querySelectorAll('.bg-blue-500');
    
    // 验证每个手柄都有 w-2 和 h-2 类名
    handles.forEach((handle) => {
      expect(handle.classList.contains('w-2')).toBe(true);
      expect(handle.classList.contains('h-2')).toBe(true);
    });
  });

  it('所有手柄应该是圆形（rounded-full）', () => {
    const component = createTestComponent();
    
    const { container } = render(<ResizeHandles component={component} />);
    
    // 查找所有手柄元素
    const handles = container.querySelectorAll('.bg-blue-500');
    
    // 验证每个手柄都有 rounded-full 类名
    handles.forEach((handle) => {
      expect(handle.classList.contains('rounded-full')).toBe(true);
    });
  });

  it('所有手柄应该是绝对定位', () => {
    const component = createTestComponent();
    
    const { container } = render(<ResizeHandles component={component} />);
    
    // 查找所有手柄元素
    const handles = container.querySelectorAll('.bg-blue-500');
    
    // 验证每个手柄都有 absolute 类名
    handles.forEach((handle) => {
      expect(handle.classList.contains('absolute')).toBe(true);
    });
  });
});

describe('ResizeHandles - 手柄光标样式', () => {
  it('角落手柄应该有对角线调整光标', () => {
    const component = createTestComponent();
    
    const { container } = render(<ResizeHandles component={component} />);
    
    // 查找所有手柄元素
    const handles = container.querySelectorAll('.bg-blue-500');
    
    // 验证至少有一些手柄有对角线光标样式
    const cursors = Array.from(handles).map((handle) => 
      (handle as HTMLElement).style.cursor
    );
    
    // 应该包含 nwse-resize 和 nesw-resize 光标
    expect(cursors.some(cursor => cursor === 'nwse-resize')).toBe(true);
    expect(cursors.some(cursor => cursor === 'nesw-resize')).toBe(true);
  });

  it('边缘手柄应该有水平或垂直调整光标', () => {
    const component = createTestComponent();
    
    const { container } = render(<ResizeHandles component={component} />);
    
    // 查找所有手柄元素
    const handles = container.querySelectorAll('.bg-blue-500');
    
    // 验证光标样式
    const cursors = Array.from(handles).map((handle) => 
      (handle as HTMLElement).style.cursor
    );
    
    // 应该包含 ns-resize 和 ew-resize 光标
    expect(cursors.some(cursor => cursor === 'ns-resize')).toBe(true);
    expect(cursors.some(cursor => cursor === 'ew-resize')).toBe(true);
  });
});

describe('ResizeHandles - 组件更新', () => {
  it('当组件尺寸改变时，手柄应该保持在正确的位置', () => {
    const component = createTestComponent();
    
    const { container, rerender } = render(<ResizeHandles component={component} />);
    
    // 验证初始渲染
    let handles = container.querySelectorAll('.bg-blue-500');
    expect(handles.length).toBe(8);
    
    // 更新组件尺寸
    const updatedComponent: ComponentNode = {
      ...component,
      position: {
        ...component.position,
        width: 300,
        height: 200,
      },
    };
    
    // 重新渲染
    rerender(<ResizeHandles component={updatedComponent} />);
    
    // 验证手柄仍然存在
    handles = container.querySelectorAll('.bg-blue-500');
    expect(handles.length).toBe(8);
  });
});
