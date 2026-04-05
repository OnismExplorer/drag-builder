/**
 * ProjectList 组件单元测试
 * 测试项目列表渲染和项目加载流程
 *
 * 需求：10.6, 10.7
 * - 10.6: 在首页展示"我的项目"列表，每个卡片显示项目名称、创建时间、预览缩略图
 * - 10.7: 点击项目卡片发送 GET 请求，恢复画布状态和所有组件
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProjectList from '../../src/components/ProjectList/ProjectList';
import { useUIStore } from '../../src/store/uiStore';
import { useCanvasStore } from '../../src/store/canvasStore';
import { useComponentStore } from '../../src/store/componentStore';
import * as projectApi from '../../src/api/projectApi';
import type { Project } from '../../src/types/project';
import type { ProjectListResponse } from '../../src/api/projectApi';

// ============================================================
// 测试辅助函数
// ============================================================

/**
 * 创建模拟项目数据
 */
function createMockProject(overrides?: Partial<Project>): Project {
  return {
    id: 'project-uuid-001',
    name: '测试项目',
    canvasConfig: {
      width: 1440,
      height: 900,
      preset: 'desktop',
      backgroundColor: '#FFFFFF',
    },
    componentsTree: [],
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T12:00:00.000Z',
    ...overrides,
  };
}

/**
 * 创建模拟项目列表响应
 */
function createMockProjectListResponse(projects: Project[]): ProjectListResponse {
  return {
    data: projects,
    total: projects.length,
    page: 1,
    limit: 50,
  };
}

/**
 * 渲染 ProjectList 组件（包含路由上下文）
 */
function renderProjectList() {
  return render(
    <MemoryRouter>
      <ProjectList />
    </MemoryRouter>
  );
}

// ============================================================
// 测试套件
// ============================================================

describe('ProjectList 组件', () => {
  // 每个测试前重置 store 状态
  beforeEach(() => {
    useUIStore.setState({
      isCodePreviewOpen: false,
      isCanvasSizeModalOpen: false,
      toast: null,
      isLoading: false,
      snapLines: [],
      isDraggingComponent: false,
      isGridSnapEnabled: true,
      dragPosition: null,
      dragOffset: null,
      draggingComponentId: null,
    });
    useCanvasStore.getState().resetCanvas();
    useComponentStore.getState().clearAll();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // 测试场景 1：项目列表渲染（需求 10.6）
  // ============================================================

  describe('项目列表渲染（需求 10.6）', () => {
    it('应该显示"我的项目"标题', async () => {
      // 模拟 API 返回空列表
      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([])
      );

      renderProjectList();

      // 标题应立即渲染
      expect(screen.getByText('我的项目')).toBeTruthy();
    });

    it('加载中时应显示骨架屏占位符', () => {
      // 模拟 API 永不返回（保持加载状态）
      vi.spyOn(projectApi, 'getProjects').mockReturnValue(new Promise(() => {}));

      const { container } = renderProjectList();

      // 应显示 animate-pulse 骨架屏
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('空列表时应显示"暂无项目"提示', async () => {
      // 模拟 API 返回空列表
      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([])
      );

      renderProjectList();

      // 等待加载完成
      await waitFor(() => {
        expect(screen.getByText('暂无项目')).toBeTruthy();
      });
    });

    it('空列表时应显示"创建第一个项目"按钮', async () => {
      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([])
      );

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('创建第一个项目')).toBeTruthy();
      });
    });

    it('有项目时应渲染项目卡片列表', async () => {
      const mockProjects = [
        createMockProject({ id: 'p1', name: '项目 A' }),
        createMockProject({ id: 'p2', name: '项目 B' }),
        createMockProject({ id: 'p3', name: '项目 C' }),
      ];

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse(mockProjects)
      );

      renderProjectList();

      // 等待项目卡片渲染
      await waitFor(() => {
        expect(screen.getByText('项目 A')).toBeTruthy();
        expect(screen.getByText('项目 B')).toBeTruthy();
        expect(screen.getByText('项目 C')).toBeTruthy();
      });
    });

    it('应显示项目数量统计', async () => {
      const mockProjects = [
        createMockProject({ id: 'p1', name: '项目 A' }),
        createMockProject({ id: 'p2', name: '项目 B' }),
      ];

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse(mockProjects)
      );

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('共 2 个项目')).toBeTruthy();
      });
    });

    it('项目卡片应显示组件数量徽章', async () => {
      const mockProject = createMockProject({
        componentsTree: [
          // 模拟 3 个组件（只需要 length 属性）
          {} as never,
          {} as never,
          {} as never,
        ],
      });

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([mockProject])
      );

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('3 个组件')).toBeTruthy();
      });
    });

    it('项目卡片应显示画布尺寸信息', async () => {
      const mockProject = createMockProject({
        canvasConfig: {
          width: 375,
          height: 667,
          preset: 'mobile',
          backgroundColor: '#FFFFFF',
        },
      });

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([mockProject])
      );

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('375 × 667')).toBeTruthy();
      });
    });

    it('有项目时应显示"新建项目"卡片', async () => {
      const mockProjects = [createMockProject()];

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse(mockProjects)
      );

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('新建项目')).toBeTruthy();
      });
    });
  });

  // ============================================================
  // 测试场景 2：创建新项目按钮（需求 10.6）
  // ============================================================

  describe('创建新项目按钮（需求 10.6）', () => {
    it('应显示"创建新项目"按钮', async () => {
      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([])
      );

      renderProjectList();

      // 标题栏的"创建新项目"按钮应立即可见
      expect(screen.getByText('创建新项目')).toBeTruthy();
    });

    it('点击"创建新项目"按钮应打开画布规格选择模态框', async () => {
      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([])
      );

      renderProjectList();

      // 点击"创建新项目"按钮
      const createButton = screen.getByText('创建新项目').closest('button');
      expect(createButton).toBeTruthy();

      act(() => {
        fireEvent.click(createButton!);
      });

      // 验证模态框已打开
      expect(useUIStore.getState().isCanvasSizeModalOpen).toBe(true);
    });
  });

  // ============================================================
  // 测试场景 3：错误状态处理
  // ============================================================

  describe('错误状态处理', () => {
    it('API 请求失败时应显示错误提示', async () => {
      // 模拟 API 请求失败
      vi.spyOn(projectApi, 'getProjects').mockRejectedValueOnce(
        new Error('Network Error')
      );

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('无法加载项目列表，请检查网络连接')).toBeTruthy();
      });
    });

    it('API 请求失败时应显示"重试"按钮', async () => {
      vi.spyOn(projectApi, 'getProjects').mockRejectedValueOnce(
        new Error('Network Error')
      );

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('重试')).toBeTruthy();
      });
    });

    it('点击"重试"按钮应重新请求项目列表', async () => {
      // 第一次请求失败
      const getProjectsSpy = vi
        .spyOn(projectApi, 'getProjects')
        .mockRejectedValueOnce(new Error('Network Error'))
        // 第二次请求成功
        .mockResolvedValueOnce(createMockProjectListResponse([]));

      renderProjectList();

      // 等待错误状态显示
      await waitFor(() => {
        expect(screen.getByText('重试')).toBeTruthy();
      });

      // 点击重试按钮
      const retryButton = screen.getByText('重试').closest('button');
      act(() => {
        fireEvent.click(retryButton!);
      });

      // 验证 API 被调用了两次
      await waitFor(() => {
        expect(getProjectsSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ============================================================
  // 测试场景 4：项目加载流程（需求 10.7）
  // ============================================================

  describe('项目加载流程（需求 10.7）', () => {
    it('点击项目卡片应调用 getProject API', async () => {
      const mockProject = createMockProject({ id: 'project-001' });

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([mockProject])
      );

      const getProjectSpy = vi
        .spyOn(projectApi, 'getProject')
        .mockResolvedValueOnce(mockProject);

      renderProjectList();

      // 等待项目卡片渲染
      await waitFor(() => {
        expect(screen.getByText('测试项目')).toBeTruthy();
      });

      // 点击项目卡片
      const projectCard = screen.getByText('测试项目').closest('button');
      await act(async () => {
        fireEvent.click(projectCard!);
      });

      // 验证 getProject 被调用，且传入正确的项目 ID
      expect(getProjectSpy).toHaveBeenCalledWith('project-001');
    });

    it('加载项目成功后应恢复画布配置', async () => {
      const mockProject = createMockProject({
        id: 'project-001',
        canvasConfig: {
          width: 375,
          height: 667,
          preset: 'mobile',
          backgroundColor: '#F0F0F0',
        },
      });

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([mockProject])
      );
      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(mockProject);

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('测试项目')).toBeTruthy();
      });

      const projectCard = screen.getByText('测试项目').closest('button');
      await act(async () => {
        fireEvent.click(projectCard!);
      });

      // 验证画布配置已恢复
      await waitFor(() => {
        const canvasConfig = useCanvasStore.getState().config;
        expect(canvasConfig.width).toBe(375);
        expect(canvasConfig.height).toBe(667);
        expect(canvasConfig.backgroundColor).toBe('#F0F0F0');
      });
    });

    it('加载项目成功后应恢复组件树', async () => {
      const mockComponents = [
        {
          id: 'comp-001',
          type: 'button' as const,
          position: { x: 100, y: 100, zIndex: 1 },
          styles: {
            width: 120,
            height: 40,
            backgroundColor: '#C2410C',
            color: '#FFFFFF',
            borderRadius: 8,
            borderWidth: 0,
            borderColor: 'transparent',
            fontSize: 14,
            fontWeight: 'normal' as const,
            opacity: 1,
            boxShadow: 'none',
          },
          content: { text: '按钮' },
          children: [],
        },
      ];

      const mockProject = createMockProject({
        id: 'project-001',
        componentsTree: mockComponents,
      });

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([mockProject])
      );
      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(mockProject);

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('测试项目')).toBeTruthy();
      });

      const projectCard = screen.getByText('测试项目').closest('button');
      await act(async () => {
        fireEvent.click(projectCard!);
      });

      // 验证组件树已恢复
      await waitFor(() => {
        const components = useComponentStore.getState().components;
        expect(components).toHaveLength(1);
        expect(components[0].id).toBe('comp-001');
      });
    });

    it('加载项目成功后应重置缩放和平移', async () => {
      const mockProject = createMockProject({ id: 'project-001' });

      // 先设置非默认的缩放和平移
      useCanvasStore.getState().setZoom(1.5);
      useCanvasStore.getState().setPan({ x: 100, y: 200 });

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([mockProject])
      );
      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(mockProject);

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('测试项目')).toBeTruthy();
      });

      const projectCard = screen.getByText('测试项目').closest('button');
      await act(async () => {
        fireEvent.click(projectCard!);
      });

      // 验证缩放和平移已重置为默认值
      await waitFor(() => {
        expect(useCanvasStore.getState().zoom).toBe(1.0);
        expect(useCanvasStore.getState().pan).toEqual({ x: 0, y: 0 });
      });
    });

    it('加载项目成功后应显示成功 Toast', async () => {
      const mockProject = createMockProject({
        id: 'project-001',
        name: '我的设计稿',
      });

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([mockProject])
      );
      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(mockProject);

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('我的设计稿')).toBeTruthy();
      });

      const projectCard = screen.getByText('我的设计稿').closest('button');
      await act(async () => {
        fireEvent.click(projectCard!);
      });

      // 验证成功 Toast 已显示
      await waitFor(() => {
        const toast = useUIStore.getState().toast;
        expect(toast).not.toBeNull();
        expect(toast?.type).toBe('success');
        expect(toast?.message).toContain('我的设计稿');
      });
    });

    it('加载项目失败时应显示错误 Toast', async () => {
      const mockProject = createMockProject({ id: 'project-001' });

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([mockProject])
      );
      // 模拟 getProject 失败
      vi.spyOn(projectApi, 'getProject').mockRejectedValueOnce(
        new Error('加载失败')
      );

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('测试项目')).toBeTruthy();
      });

      const projectCard = screen.getByText('测试项目').closest('button');
      await act(async () => {
        fireEvent.click(projectCard!);
      });

      // 验证错误 Toast 已显示
      await waitFor(() => {
        const toast = useUIStore.getState().toast;
        expect(toast).not.toBeNull();
        expect(toast?.type).toBe('error');
        expect(toast?.message).toContain('加载项目失败');
      });
    });

    it('加载项目时应显示加载遮罩', async () => {
      const mockProject = createMockProject({ id: 'project-001' });

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([mockProject])
      );

      // 模拟 getProject 延迟返回（保持加载状态）
      vi.spyOn(projectApi, 'getProject').mockReturnValue(new Promise(() => {}));

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('测试项目')).toBeTruthy();
      });

      const projectCard = screen.getByText('测试项目').closest('button');
      act(() => {
        fireEvent.click(projectCard!);
      });

      // 验证加载中文字显示
      await waitFor(() => {
        expect(screen.getByText('加载中...')).toBeTruthy();
      });
    });

    it('加载完成后应清除加载状态', async () => {
      const mockProject = createMockProject({ id: 'project-001' });

      vi.spyOn(projectApi, 'getProjects').mockResolvedValueOnce(
        createMockProjectListResponse([mockProject])
      );
      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(mockProject);

      renderProjectList();

      await waitFor(() => {
        expect(screen.getByText('测试项目')).toBeTruthy();
      });

      const projectCard = screen.getByText('测试项目').closest('button');
      await act(async () => {
        fireEvent.click(projectCard!);
      });

      // 验证加载状态已清除
      await waitFor(() => {
        expect(useUIStore.getState().isLoading).toBe(false);
      });
    });
  });

  // ============================================================
  // 测试场景 5：组件挂载时自动获取项目列表
  // ============================================================

  describe('组件挂载时自动获取项目列表', () => {
    it('组件挂载时应自动调用 getProjects API', async () => {
      const getProjectsSpy = vi
        .spyOn(projectApi, 'getProjects')
        .mockResolvedValueOnce(createMockProjectListResponse([]));

      renderProjectList();

      // 验证 API 被调用
      await waitFor(() => {
        expect(getProjectsSpy).toHaveBeenCalledTimes(1);
      });
    });

    it('应以 limit: 50 参数调用 getProjects', async () => {
      const getProjectsSpy = vi
        .spyOn(projectApi, 'getProjects')
        .mockResolvedValueOnce(createMockProjectListResponse([]));

      renderProjectList();

      await waitFor(() => {
        expect(getProjectsSpy).toHaveBeenCalledWith({ limit: 50 });
      });
    });
  });
});
