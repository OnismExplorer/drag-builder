/**
 * FloatingPreview 组件测试
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FloatingPreview } from '../../src/components/MaterialPanel/FloatingPreview';
import type { MaterialConfig } from '../../src/components/MaterialPanel/materialConfig';

describe('FloatingPreview 组件', () => {
  const mockConfig: MaterialConfig = {
    type: 'button',
    label: '按钮',
    icon: '▭',
    description: '可点击按钮',
    backgroundColor: '#fef3c7',
    starColor: '#fbbf24',
  };

  it('当 isVisible 为 false 时不应该渲染', () => {
    const { container } = render(
      <FloatingPreview config={mockConfig} isVisible={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('当 isVisible 为 true 时应该渲染', () => {
    render(<FloatingPreview config={mockConfig} isVisible={true} />);
    
    expect(screen.getByText('按钮')).toBeTruthy();
    expect(screen.getByText('可点击按钮')).toBeTruthy();
  });

  it('当 config 为 null 时不应该渲染', () => {
    const { container } = render(
      <FloatingPreview config={null} isVisible={true} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('应该显示组件名称和描述', () => {
    render(<FloatingPreview config={mockConfig} isVisible={true} />);
    
    const label = screen.getByText('按钮');
    const description = screen.getByText('可点击按钮');
    
    expect(label).toBeTruthy();
    expect(description).toBeTruthy();
  });

  it('应该应用正确的背景色', () => {
    const { container } = render(
      <FloatingPreview config={mockConfig} isVisible={true} />
    );
    
    const iconContainer = container.querySelector('.w-16.h-16');
    expect(iconContainer).toBeTruthy();
  });

  it('应该渲染不同类型的图标', () => {
    const configs: MaterialConfig[] = [
      { type: 'div', label: '容器', icon: '□', description: '通用容器' },
      { type: 'text', label: '文本', icon: 'T', description: '文本内容' },
      { type: 'radio', label: '单选', icon: '◉', description: '单选按钮' },
    ];

    configs.forEach((config) => {
      const { unmount } = render(
        <FloatingPreview config={config} isVisible={true} />
      );
      
      expect(screen.getByText(config.label)).toBeTruthy();
      unmount();
    });
  });
});
