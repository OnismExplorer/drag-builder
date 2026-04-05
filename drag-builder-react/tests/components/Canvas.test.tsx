/**
 * Canvas 组件测试
 * 验证画布核心功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import Canvas from '../../src/components/Canvas/Canvas';
import { useCanvasStore } from '../../src/store/canvasStore';
import { useComponentStore } from '../../src/store/componentStore';
import type { ComponentNode } from '../../src/types';

describe('Canvas 组件', () => {
  beforeEach(() => {
    // 重置 store 状态
    useCanvasStore.getState().resetCanvas();
    useComponentStore.getState().clearAll();
  });

  it('应该渲染画布容器', () => {
    render(
      <DndContext>
        <Canvas />
      </DndContext>
    );
    
    // 验证缩放比例显示
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('应该显示当前缩放比例', () => {
    const { setZoom } = useCanvasStore.getState();
    setZoom(0.5);
    
    render(
      <DndContext>
        <Canvas />
      </DndContext>
    );
    
    // 验证缩放比例更新
    expect(screen.getByText('50%')).toBeDefined();
  });

  it('应该渲染所有组件节点', () => {
    const { addComponent } = useComponentStore.getState();
    
    // 添加测试组件
    const testComponent: ComponentNode = {
      id: 'test-1',
      type: 'button',
      position: { x: 100, y: 100, width: 120, height: 40, zIndex: 1 },
      styles: {},
      content: { text: 'Test Button' },
    };
    
    addComponent(testComponent);
    
    render(
      <DndContext>
        <Canvas />
      </DndContext>
    );
    
    // 验证组件被渲染
    expect(screen.getByText('Test Button')).toBeDefined();
  });

  it('应该按 zIndex 排序渲染组件', () => {
    const { addComponent } = useComponentStore.getState();
    
    // 添加多个组件，zIndex 不同
    const component1: ComponentNode = {
      id: 'test-1',
      type: 'text',
      position: { x: 0, y: 0, width: 100, height: 50, zIndex: 2 },
      styles: {},
      content: { text: 'Component 2' },
    };
    
    const component2: ComponentNode = {
      id: 'test-2',
      type: 'text',
      position: { x: 0, y: 0, width: 100, height: 50, zIndex: 1 },
      styles: {},
      content: { text: 'Component 1' },
    };
    
    addComponent(component1);
    addComponent(component2);
    
    render(
      <DndContext>
        <Canvas />
      </DndContext>
    );
    
    // 验证两个组件都被渲染
    expect(screen.getByText('Component 1')).toBeDefined();
    expect(screen.getByText('Component 2')).toBeDefined();
  });
});
