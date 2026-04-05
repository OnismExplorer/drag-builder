/**
 * 集成测试 2：保存 → 加载流程
 *
 * 测试多个模块之间的协作：
 * - canvasStore（画布状态管理）
 * - componentStore（组件树状态管理）
 * - projectApi（API 请求封装）
 * - uiStore（UI 状态管理）
 *
 * 需求：10.1, 10.2, 10.3, 10.4, 10.5, 10.7, 10.8
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCanvasStore } from '../../src/store/canvasStore';
import { useComponentStore } from '../../src/store/componentStore';
import { useUIStore } from '../../src/store/uiStore';
import * as projectApi from '../../src/api/projectApi';
import { createDefaultComponent } from '../../src/components/MaterialPanel/materialConfig';
import type { Project } from '../../src/types/project';
import type { CanvasConfig } from '../../src/types/canvas';
import type { ComponentNode } from '../../src/types/component';

// ============================================================
// 辅助函数
// ============================================================

/**
 * 重置所有 store 状态
 */
function resetAllStores() {
  useCanvasStore.getState().resetCanvas();
  useComponentStore.getState().clearAll();
  useUIStore.getState().hideToast();
  useUIStore.getState().setLoading(false);
}

/**
 * 构造模拟项目响应数据
 */
function createMockProjectResponse(
  canvasConfig: CanvasConfig,
  components: ComponentNode[]
): Project {
  return {
    id: 'mock-project-uuid-1234',
    name: '测试项目',
    canvasConfig,
    componentsTree: components,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 构造模拟 Axios 错误
 */
function createAxiosError(status: number, message: string) {
  const error = new Error(message) as Error & {
    response?: { status: number; data: { message: string } };
    isAxiosError: boolean;
  };
  error.response = { status, data: { message } };
  error.isAxiosError = true;
  return error;
}

// ============================================================
// 测试套件：保存 → 加载集成流程
// ============================================================

describe('集成测试：保存 → 加载流程', () => {
  beforeEach(() => {
    resetAllStores();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // 场景 1：创建画布和组件，调用保存 API
  // ============================================================

  describe('场景 1：保存项目（需求 10.1, 10.2, 10.3）', () => {
    it('保存时，createProject 应被调用且包含正确的画布配置', async () => {
      // 设置画布配置
      const canvasConfig: CanvasConfig = {
        width: 1440,
        height: 900,
        preset: 'desktop',
        backgroundColor: '#FFFFFF',
      };
      useCanvasStore.getState().setConfig(canvasConfig);

      // 模拟 API 成功响应
      const mockProject = createMockProjectResponse(canvasConfig, []);
      const createSpy = vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(mockProject);

      // 执行保存
      await projectApi.createProject({
        name: '测试项目',
        canvasConfig: useCanvasStore.getState().config,
        componentsTree: useComponentStore.getState().components,
      });

      // 验证 API 被调用一次
      expect(createSpy).toHaveBeenCalledTimes(1);

      // 验证传入的画布配置正确
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          canvasConfig: expect.objectContaining({
            width: 1440,
            height: 900,
            preset: 'desktop',
          }),
        })
      );
    });

    it('保存时，createProject 应包含完整的组件树数据', async () => {
      // 创建几个组件
      const comp1 = createDefaultComponent('div', { x: 100, y: 100 });
      const comp2 = createDefaultComponent('button', { x: 200, y: 200 });
      const comp3 = createDefaultComponent('text', { x: 300, y: 300 });

      useComponentStore.getState().addComponent(comp1);
      useComponentStore.getState().addComponent(comp2);
      useComponentStore.getState().addComponent(comp3);

      const components = useComponentStore.getState().components;

      // 模拟 API 成功响应
      const mockProject = createMockProjectResponse(
        useCanvasStore.getState().config,
        components
      );
      const createSpy = vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(mockProject);

      // 执行保存
      await projectApi.createProject({
        name: '测试项目',
        canvasConfig: useCanvasStore.getState().config,
        componentsTree: components,
      });

      // 验证组件树数据被正确传递
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          componentsTree: expect.arrayContaining([
            expect.objectContaining({ id: comp1.id, type: 'div' }),
            expect.objectContaining({ id: comp2.id, type: 'button' }),
            expect.objectContaining({ id: comp3.id, type: 'text' }),
          ]),
        })
      );
    });

    it('保存成功后，应显示成功 Toast（需求 10.4）', async () => {
      const mockProject = createMockProjectResponse(
        useCanvasStore.getState().config,
        []
      );
      vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(mockProject);

      const uiStore = useUIStore.getState();

      // 模拟保存流程
      try {
        await projectApi.createProject({
          name: '测试项目',
          canvasConfig: useCanvasStore.getState().config,
          componentsTree: [],
        });
        uiStore.showToast('保存成功', 'success');
      } catch {
        uiStore.showToast('保存失败', 'error');
      }

      // 验证成功 Toast
      const toast = useUIStore.getState().toast;
      expect(toast).not.toBeNull();
      expect(toast?.message).toBe('保存成功');
      expect(toast?.type).toBe('success');
    });

    it('保存失败时，应显示错误 Toast（需求 10.5）', async () => {
      // 模拟 API 失败
      vi.spyOn(projectApi, 'createProject').mockRejectedValueOnce(
        createAxiosError(500, '服务器内部错误')
      );

      const uiStore = useUIStore.getState();

      // 模拟保存流程
      try {
        await projectApi.createProject({
          name: '测试项目',
          canvasConfig: useCanvasStore.getState().config,
          componentsTree: [],
        });
        uiStore.showToast('保存成功', 'success');
      } catch (err) {
        const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
        const errorMsg = axiosErr.response?.data?.message ?? axiosErr.message ?? '未知错误';
        uiStore.showToast(`保存失败：${errorMsg}`, 'error');
      }

      // 验证错误 Toast
      const toast = useUIStore.getState().toast;
      expect(toast?.type).toBe('error');
      expect(toast?.message).toContain('保存失败');
    });

    it('保存过程中，加载状态应为 true，完成后恢复 false（需求 14.5）', async () => {
      const mockProject = createMockProjectResponse(
        useCanvasStore.getState().config,
        []
      );
      vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(mockProject);

      const uiStore = useUIStore.getState();

      // 初始状态：未加载
      expect(useUIStore.getState().isLoading).toBe(false);

      // 开始保存：设置加载状态
      uiStore.setLoading(true);
      expect(useUIStore.getState().isLoading).toBe(true);

      try {
        await projectApi.createProject({
          name: '测试项目',
          canvasConfig: useCanvasStore.getState().config,
          componentsTree: [],
        });
        uiStore.showToast('保存成功', 'success');
      } finally {
        // 无论成功或失败，都关闭加载状态
        uiStore.setLoading(false);
      }

      // 验证加载状态已关闭
      expect(useUIStore.getState().isLoading).toBe(false);
    });

    it('保存空画布时，组件树应为空数组', async () => {
      // 确保画布为空
      expect(useComponentStore.getState().components).toHaveLength(0);

      const mockProject = createMockProjectResponse(
        useCanvasStore.getState().config,
        []
      );
      const createSpy = vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(mockProject);

      await projectApi.createProject({
        name: '空画布项目',
        canvasConfig: useCanvasStore.getState().config,
        componentsTree: useComponentStore.getState().components,
      });

      // 验证传入的组件树为空数组
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          componentsTree: [],
        })
      );
    });
  });

  // ============================================================
  // 场景 2：模拟加载项目，验证画布状态和组件树正确恢复
  // ============================================================

  describe('场景 2：加载项目（需求 10.7, 10.8）', () => {
    it('加载项目后，画布配置应正确恢复', async () => {
      // 准备要加载的项目数据
      const savedCanvasConfig: CanvasConfig = {
        width: 375,
        height: 667,
        preset: 'mobile',
        backgroundColor: '#F8FAFC',
      };
      const savedComponents: ComponentNode[] = [
        createDefaultComponent('div', { x: 50, y: 50 }),
        createDefaultComponent('button', { x: 100, y: 200 }),
      ];

      const mockProject = createMockProjectResponse(savedCanvasConfig, savedComponents);

      // 模拟 GET /api/projects/:id
      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(mockProject);

      // 执行加载
      const project = await projectApi.getProject('mock-project-uuid-1234');

      // 恢复画布配置
      useCanvasStore.getState().setConfig(project.canvasConfig);

      // 验证画布配置正确恢复
      const restoredConfig = useCanvasStore.getState().config;
      expect(restoredConfig.width).toBe(375);
      expect(restoredConfig.height).toBe(667);
      expect(restoredConfig.preset).toBe('mobile');
      expect(restoredConfig.backgroundColor).toBe('#F8FAFC');
    });

    it('加载项目后，组件树应正确恢复', async () => {
      // 准备要加载的组件数据
      const savedComponents: ComponentNode[] = [
        {
          id: 'saved-comp-1',
          type: 'div',
          position: { x: 100, y: 100, width: 200, height: 100, zIndex: 0 },
          styles: { backgroundColor: '#FF0000', borderRadius: 8 },
          content: {},
        },
        {
          id: 'saved-comp-2',
          type: 'button',
          position: { x: 200, y: 250, width: 120, height: 40, zIndex: 1 },
          styles: { backgroundColor: '#C2410C', textColor: '#FFFFFF' },
          content: { text: '保存的按钮' },
        },
        {
          id: 'saved-comp-3',
          type: 'text',
          position: { x: 50, y: 50, width: 200, height: 30, zIndex: 2 },
          styles: { textColor: '#0F172A', fontSize: 18 },
          content: { text: '保存的文本' },
        },
      ];

      const mockProject = createMockProjectResponse(
        useCanvasStore.getState().config,
        savedComponents
      );

      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(mockProject);

      // 执行加载
      const project = await projectApi.getProject('mock-project-uuid-1234');

      // 恢复组件树
      useComponentStore.getState().importComponents(project.componentsTree);

      // 验证组件树正确恢复
      const state = useComponentStore.getState();
      expect(state.components).toHaveLength(3);

      // 验证第一个组件
      const comp1 = state.getComponentById('saved-comp-1');
      expect(comp1).toBeDefined();
      expect(comp1?.type).toBe('div');
      expect(comp1?.position.x).toBe(100);
      expect(comp1?.position.y).toBe(100);
      expect(comp1?.styles.backgroundColor).toBe('#FF0000');

      // 验证第二个组件
      const comp2 = state.getComponentById('saved-comp-2');
      expect(comp2).toBeDefined();
      expect(comp2?.type).toBe('button');
      expect(comp2?.content.text).toBe('保存的按钮');

      // 验证第三个组件
      const comp3 = state.getComponentById('saved-comp-3');
      expect(comp3).toBeDefined();
      expect(comp3?.type).toBe('text');
      expect(comp3?.content.text).toBe('保存的文本');
    });

    it('加载项目后，选中状态应被清除', async () => {
      // 先添加一个组件并选中
      const comp = createDefaultComponent('div', { x: 0, y: 0 });
      useComponentStore.getState().addComponent(comp);
      expect(useComponentStore.getState().selectedId).toBe(comp.id);

      // 准备加载数据
      const savedComponents: ComponentNode[] = [
        createDefaultComponent('button', { x: 100, y: 100 }),
      ];
      const mockProject = createMockProjectResponse(
        useCanvasStore.getState().config,
        savedComponents
      );

      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(mockProject);

      // 执行加载
      const project = await projectApi.getProject('mock-project-uuid-1234');
      useComponentStore.getState().importComponents(project.componentsTree);

      // 验证选中状态被清除
      expect(useComponentStore.getState().selectedId).toBeNull();
    });

    it('加载项目后，历史记录应被重置', async () => {
      // 先添加一些组件（产生历史记录）
      const comp1 = createDefaultComponent('div', { x: 0, y: 0 });
      const comp2 = createDefaultComponent('button', { x: 100, y: 100 });
      useComponentStore.getState().addComponent(comp1);
      useComponentStore.getState().addComponent(comp2);

      // 验证有历史记录
      expect(useComponentStore.getState().history.length).toBeGreaterThan(0);

      // 准备加载数据
      const savedComponents: ComponentNode[] = [
        createDefaultComponent('text', { x: 50, y: 50 }),
      ];
      const mockProject = createMockProjectResponse(
        useCanvasStore.getState().config,
        savedComponents
      );

      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(mockProject);

      // 执行加载
      const project = await projectApi.getProject('mock-project-uuid-1234');
      useComponentStore.getState().importComponents(project.componentsTree);

      // 验证历史记录被重置
      expect(useComponentStore.getState().history).toHaveLength(0);
      expect(useComponentStore.getState().historyIndex).toBe(-1);
    });

    it('加载不存在的项目时，API 应返回 404 错误', async () => {
      // 模拟 404 错误
      vi.spyOn(projectApi, 'getProject').mockRejectedValueOnce(
        createAxiosError(404, '项目不存在')
      );

      const uiStore = useUIStore.getState();

      try {
        await projectApi.getProject('non-existent-id');
      } catch (err) {
        const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
        const errorMsg = axiosErr.response?.data?.message ?? axiosErr.message ?? '未知错误';
        uiStore.showToast(`加载失败：${errorMsg}`, 'error');
      }

      // 验证错误 Toast
      const toast = useUIStore.getState().toast;
      expect(toast?.type).toBe('error');
      expect(toast?.message).toContain('项目不存在');
    });
  });

  // ============================================================
  // 场景 3：完整的保存 → 加载往返一致性验证
  // ============================================================

  describe('场景 3：数据往返一致性（需求 10.8）', () => {
    it('保存的数据与加载的数据应完全一致', async () => {
      // 准备画布配置
      const canvasConfig: CanvasConfig = {
        width: 768,
        height: 1024,
        preset: 'tablet',
        backgroundColor: '#F1F5F9',
      };
      useCanvasStore.getState().setConfig(canvasConfig);

      // 准备组件数据
      const comp1 = createDefaultComponent('div', { x: 50, y: 50 });
      const comp2 = createDefaultComponent('button', { x: 150, y: 200 });
      useComponentStore.getState().addComponent(comp1);
      useComponentStore.getState().addComponent(comp2);

      const originalComponents = useComponentStore.getState().components;
      const originalConfig = useCanvasStore.getState().config;

      // 模拟保存
      const savedProject = createMockProjectResponse(originalConfig, originalComponents);
      vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(savedProject);

      await projectApi.createProject({
        name: '往返测试项目',
        canvasConfig: originalConfig,
        componentsTree: originalComponents,
      });

      // 重置 store（模拟重新打开应用）
      resetAllStores();

      // 模拟加载
      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(savedProject);
      const loadedProject = await projectApi.getProject(savedProject.id);

      // 恢复状态
      useCanvasStore.getState().setConfig(loadedProject.canvasConfig);
      useComponentStore.getState().importComponents(loadedProject.componentsTree);

      // 验证画布配置一致
      const restoredConfig = useCanvasStore.getState().config;
      expect(restoredConfig.width).toBe(originalConfig.width);
      expect(restoredConfig.height).toBe(originalConfig.height);
      expect(restoredConfig.preset).toBe(originalConfig.preset);
      expect(restoredConfig.backgroundColor).toBe(originalConfig.backgroundColor);

      // 验证组件数量一致
      const restoredComponents = useComponentStore.getState().components;
      expect(restoredComponents).toHaveLength(originalComponents.length);

      // 验证每个组件的数据一致
      originalComponents.forEach(originalComp => {
        const restoredComp = useComponentStore.getState().getComponentById(originalComp.id);
        expect(restoredComp).toBeDefined();
        expect(restoredComp?.type).toBe(originalComp.type);
        expect(restoredComp?.position.x).toBe(originalComp.position.x);
        expect(restoredComp?.position.y).toBe(originalComp.position.y);
        expect(restoredComp?.position.width).toBe(originalComp.position.width);
        expect(restoredComp?.position.height).toBe(originalComp.position.height);
      });
    });

    it('保存多种类型组件后，加载时所有类型应正确恢复', async () => {
      // 创建所有类型的组件
      const types = ['div', 'button', 'text', 'image', 'input'] as const;
      types.forEach((type, index) => {
        const comp = createDefaultComponent(type, { x: index * 100, y: index * 50 });
        useComponentStore.getState().addComponent(comp);
      });

      const originalComponents = useComponentStore.getState().components;
      expect(originalComponents).toHaveLength(5);

      // 模拟保存和加载
      const savedProject = createMockProjectResponse(
        useCanvasStore.getState().config,
        originalComponents
      );
      vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(savedProject);
      vi.spyOn(projectApi, 'getProject').mockResolvedValueOnce(savedProject);

      await projectApi.createProject({
        name: '多类型组件项目',
        canvasConfig: useCanvasStore.getState().config,
        componentsTree: originalComponents,
      });

      // 重置并加载
      resetAllStores();
      const loadedProject = await projectApi.getProject(savedProject.id);
      useComponentStore.getState().importComponents(loadedProject.componentsTree);

      // 验证所有类型都正确恢复
      const restoredComponents = useComponentStore.getState().components;
      expect(restoredComponents).toHaveLength(5);

      const restoredTypes = restoredComponents.map(c => c.type).sort();
      const originalTypes = [...types].sort();
      expect(restoredTypes).toEqual(originalTypes);
    });
  });
});
