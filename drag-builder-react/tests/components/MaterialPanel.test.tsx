/**
 * MaterialPanel 组件测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { MaterialPanel } from '../../src/components/MaterialPanel/MaterialPanel';

describe('MaterialPanel 组件', () => {
  const renderWithDnd = (component: React.ReactElement) => {
    return render(<DndContext>{component}</DndContext>);
  };

  it('应该渲染组件库标题', () => {
    renderWithDnd(<MaterialPanel />);
    expect(screen.getByText('组件库')).toBeTruthy();
  });

  it('应该渲染所有分类', () => {
    renderWithDnd(<MaterialPanel />);
    expect(screen.getByText('基础组件')).toBeTruthy();
    expect(screen.getByText('表单组件')).toBeTruthy();
  });

  it('应该默认展开所有分类', () => {
    const { container } = renderWithDnd(<MaterialPanel />);
    const grids = container.querySelectorAll('.grid-cols-3');
    expect(grids.length).toBeGreaterThan(0);
  });

  it('点击分类标题应该折叠/展开', () => {
    renderWithDnd(<MaterialPanel />);
    
    const categoryButton = screen.getByText('基础组件').closest('button');
    expect(categoryButton).toBeTruthy();
    
    // 点击折叠
    fireEvent.click(categoryButton!);
    
    // 再次点击展开
    fireEvent.click(categoryButton!);
  });

  it('应该显示提示信息', () => {
    renderWithDnd(<MaterialPanel />);
    expect(screen.getByText(/拖拽组件到画布开始设计/)).toBeTruthy();
  });
});
