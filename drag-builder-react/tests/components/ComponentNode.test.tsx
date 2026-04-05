/**
 * ComponentNode 组件测试
 * 验证组件节点渲染功能
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import ComponentNode from '../../src/components/Canvas/ComponentNode';
import type { ComponentNode as ComponentNodeType } from '../../src/types';

describe('ComponentNode 组件', () => {
  it('应该渲染 div 类型组件', () => {
    const component: ComponentNodeType = {
      id: 'test-div',
      type: 'div',
      position: { x: 0, y: 0, width: 200, height: 100, zIndex: 1 },
      styles: { backgroundColor: '#FFFFFF' },
      content: {},
    };

    const { container } = render(
      <DndContext>
        <ComponentNode component={component} isSelected={false} />
      </DndContext>
    );

    // 验证 div 被渲染
    const divElement = container.querySelector('div[style*="background-color"]');
    expect(divElement).toBeDefined();
  });

  it('应该渲染 button 类型组件', () => {
    const component: ComponentNodeType = {
      id: 'test-button',
      type: 'button',
      position: { x: 0, y: 0, width: 120, height: 40, zIndex: 1 },
      styles: { backgroundColor: '#C2410C' },
      content: { text: 'Click Me' },
    };

    render(
      <DndContext>
        <ComponentNode component={component} isSelected={false} />
      </DndContext>
    );

    // 验证按钮文本
    expect(screen.getByText('Click Me')).toBeDefined();
  });

  it('应该渲染 text 类型组件', () => {
    const component: ComponentNodeType = {
      id: 'test-text',
      type: 'text',
      position: { x: 0, y: 0, width: 200, height: 50, zIndex: 1 },
      styles: { fontSize: 16 },
      content: { text: 'Hello World' },
    };

    render(
      <DndContext>
        <ComponentNode component={component} isSelected={false} />
      </DndContext>
    );

    // 验证文本内容
    expect(screen.getByText('Hello World')).toBeDefined();
  });

  it('应该渲染 input 类型组件', () => {
    const component: ComponentNodeType = {
      id: 'test-input',
      type: 'input',
      position: { x: 0, y: 0, width: 240, height: 40, zIndex: 1 },
      styles: {},
      content: { placeholder: 'Enter text' },
    };

    render(
      <DndContext>
        <ComponentNode component={component} isSelected={false} />
      </DndContext>
    );

    // 验证 input 占位符
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeDefined();
  });

  it('选中时应该显示调整手柄', () => {
    const component: ComponentNodeType = {
      id: 'test-selected',
      type: 'div',
      position: { x: 0, y: 0, width: 200, height: 100, zIndex: 1 },
      styles: {},
      content: {},
    };

    const { container } = render(
      <DndContext>
        <ComponentNode component={component} isSelected={true} />
      </DndContext>
    );

    // 验证调整手柄存在（8 个手柄）
    const handles = container.querySelectorAll('.bg-blue-500.rounded-full');
    expect(handles.length).toBe(8);
  });

  it('未选中时不应该显示调整手柄', () => {
    const component: ComponentNodeType = {
      id: 'test-unselected',
      type: 'div',
      position: { x: 0, y: 0, width: 200, height: 100, zIndex: 1 },
      styles: {},
      content: {},
    };

    const { container } = render(
      <DndContext>
        <ComponentNode component={component} isSelected={false} />
      </DndContext>
    );

    // 验证没有调整手柄
    const handles = container.querySelectorAll('.bg-blue-500.rounded-full');
    expect(handles.length).toBe(0);
  });

  it('应该应用正确的位置和尺寸', () => {
    const component: ComponentNodeType = {
      id: 'test-position',
      type: 'div',
      position: { x: 100, y: 200, width: 300, height: 150, zIndex: 5 },
      styles: {},
      content: {},
    };

    const { container } = render(
      <DndContext>
        <ComponentNode component={component} isSelected={false} />
      </DndContext>
    );

    const node = container.querySelector('.component-node') as HTMLElement;
    expect(node).toBeDefined();
    expect(node.style.left).toBe('100px');
    expect(node.style.top).toBe('200px');
    expect(node.style.width).toBe('300px');
    expect(node.style.height).toBe('150px');
    expect(node.style.zIndex).toBe('5');
  });
});
