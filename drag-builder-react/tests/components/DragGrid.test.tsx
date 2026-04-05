/**
 * DragGrid 组件测试
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import DragGrid from '../../src/components/Canvas/DragGrid';

describe('DragGrid 组件', () => {
  it('应该渲染 SVG 网格', () => {
    const { container } = render(
      <DragGrid width={400} height={300} gridSize={20} />
    );
    
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('400');
    expect(svg?.getAttribute('height')).toBe('300');
  });
  
  it('应该根据 gridSize 渲染正确数量的网格线', () => {
    const { container } = render(
      <DragGrid width={400} height={300} gridSize={20} />
    );
    
    const lines = container.querySelectorAll('line');
    // 垂直线：400 / 20 + 1 = 21
    // 水平线：300 / 20 + 1 = 16
    // 总共：21 + 16 = 37
    expect(lines.length).toBe(37);
  });
  
  it('应该使用自定义 gridSize', () => {
    const { container } = render(
      <DragGrid width={400} height={300} gridSize={50} />
    );
    
    const lines = container.querySelectorAll('line');
    // 垂直线：400 / 50 + 1 = 9
    // 水平线：300 / 50 + 1 = 7
    // 总共：9 + 7 = 16
    expect(lines.length).toBe(16);
  });
  
  it('网格线应该是半透明蓝色', () => {
    const { container } = render(
      <DragGrid width={400} height={300} gridSize={20} />
    );
    
    const line = container.querySelector('line');
    expect(line?.getAttribute('stroke')).toBe('rgba(59, 130, 246, 0.2)');
  });
});
