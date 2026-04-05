/**
 * Toolbar 组件测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Toolbar from '../../src/components/Toolbar/Toolbar';
import { useUIStore } from '../../src/store/uiStore';
import { useCanvasStore } from '../../src/store/canvasStore';
import * as projectApi from '../../src/api/projectApi';

describe('Toolbar 组件', () => {
  beforeEach(() => {
    // 重置所有 store
    useUIStore.setState({
      isCodePreviewOpen: false,
      isCanvasSizeModalOpen: false,
      toast: null,
      isLoading: false,
      snapLines: [],
      isDraggingComponent: false,
      isGridSnapEnabled: true,
    });
    
    useCanvasStore.setState({
      config: {
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
      },
      zoom: 1,
      pan: { x: 0, y: 0 },
    });
  });
  
  describe('基本渲染', () => {
    it('应该渲染 Logo 和项目名称', () => {
      render(<Toolbar projectName="测试项目" />);
      
      expect(screen.getByText('DragBuilder')).toBeTruthy();
      expect(screen.getByText('测试项目')).toBeTruthy();
    });
    
    it('应该渲染所有操作按钮', () => {
      render(<Toolbar />);
      
      expect(screen.getByText('网格吸附')).toBeTruthy();
      expect(screen.getByText('查看代码')).toBeTruthy();
      expect(screen.getByText('保存项目')).toBeTruthy();
    });
  });
  
  describe('网格吸附按钮', () => {
    it('应该显示网格吸附按钮', () => {
      render(<Toolbar />);
      
      const button = screen.getByText('网格吸附').closest('button');
      expect(button).toBeTruthy();
    });
    
    it('启用状态时应该显示绿色指示器', () => {
      useUIStore.setState({ isGridSnapEnabled: true });
      
      const { container } = render(<Toolbar />);
      
      const indicator = container.querySelector('.bg-green-500');
      expect(indicator).toBeTruthy();
    });
    
    it('禁用状态时应该显示灰色指示器', () => {
      useUIStore.setState({ isGridSnapEnabled: false });
      
      const { container } = render(<Toolbar />);
      
      const indicator = container.querySelector('.bg-slate-300');
      expect(indicator).toBeTruthy();
    });
    
    it('点击按钮应该切换网格吸附状态', () => {
      useUIStore.setState({ isGridSnapEnabled: true });
      
      render(<Toolbar />);
      
      const button = screen.getByText('网格吸附').closest('button');
      expect(button).toBeTruthy();
      
      // 点击按钮
      fireEvent.click(button!);
      
      // 状态应该切换
      expect(useUIStore.getState().isGridSnapEnabled).toBe(false);
    });
    
    it('启用状态时按钮应该有橙色高亮样式', () => {
      useUIStore.setState({ isGridSnapEnabled: true });
      
      render(<Toolbar />);
      
      const button = screen.getByText('网格吸附').closest('button');
      expect(button?.className).toContain('text-orange-700');
      expect(button?.className).toContain('bg-orange-50');
    });
    
    it('禁用状态时按钮应该有默认样式', () => {
      useUIStore.setState({ isGridSnapEnabled: false });
      
      render(<Toolbar />);
      
      const button = screen.getByText('网格吸附').closest('button');
      expect(button?.className).toContain('text-slate-600');
      expect(button?.className).toContain('bg-white');
    });
    
    it('按钮应该有快捷键提示', () => {
      render(<Toolbar />);
      
      const button = screen.getByText('网格吸附').closest('button');
      expect(button?.getAttribute('title')).toContain('Ctrl+Shift+G');
    });
  });
  
  describe('其他按钮', () => {
    it('点击查看代码按钮应该打开代码预览', () => {
      render(<Toolbar />);
      
      const button = screen.getByText('查看代码').closest('button');
      fireEvent.click(button!);
      
      expect(useUIStore.getState().isCodePreviewOpen).toBe(true);
    });
    
    it('点击保存按钮应该调用 createProject API', async () => {
      // Mock createProject API
      const mockCreateProject = vi.spyOn(projectApi, 'createProject').mockResolvedValue({
        id: 'test-id',
        name: '未命名项目',
        canvasConfig: { width: 1920, height: 1080, preset: 'desktop', backgroundColor: '#ffffff' },
        componentsTree: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });

      render(<Toolbar />);

      const button = screen.getByText('保存项目').closest('button');
      await act(async () => {
        fireEvent.click(button!);
      });

      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledTimes(1);
      });

      mockCreateProject.mockRestore();
    });

    it('保存中时按钮应该禁用', async () => {
      // Mock createProject 为一个永不 resolve 的 Promise，模拟保存中状态
      let resolvePromise!: () => void;
      const pendingPromise = new Promise<typeof import('../../src/types/project').Project>((resolve) => {
        resolvePromise = () => resolve({
          id: 'test-id',
          name: '未命名项目',
          canvasConfig: { width: 1920, height: 1080, preset: 'desktop', backgroundColor: '#ffffff' },
          componentsTree: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        });
      });
      const mockCreateProject = vi.spyOn(projectApi, 'createProject').mockReturnValue(pendingPromise);

      render(<Toolbar />);

      const saveButton = screen.getByText('保存项目').closest('button');
      fireEvent.click(saveButton!);

      // 等待按钮变为"保存中..."状态
      await waitFor(() => {
        const savingButton = screen.getByText('保存中...').closest('button');
        expect(savingButton?.hasAttribute('disabled')).toBe(true);
      });

      // 清理
      resolvePromise();
      mockCreateProject.mockRestore();
    });
  });
});
