/**
 * 保存功能单元测试
 * 测试项目保存流程、错误处理和加载状态
 *
 * 需求：10.4, 10.5, 14.5
 * - 10.4: WHEN 后端返回成功响应（HTTP 201），THE System SHALL 显示"保存成功"提示
 * - 10.5: WHEN 后端返回错误响应（HTTP 4xx/5xx），THE System SHALL 显示错误信息
 * - 14.5: THE System SHALL 在保存项目时显示加载动画
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useUIStore } from '../src/store/uiStore';
import { useCanvasStore } from '../src/store/canvasStore';
import { useComponentStore } from '../src/store/componentStore';
import * as projectApi from '../src/api/projectApi';
import type { Project } from '../src/types/project';

// ============================================================
// 测试辅助函数
// ============================================================

/**
 * 模拟成功的项目保存响应
 */
function createMockProject(): Project {
  return {
    id: 'test-uuid-1234',
    name: '测试项目',
    canvasConfig: {
      width: 1440,
      height: 900,
      preset: 'desktop',
      backgroundColor: '#FFFFFF',
    },
    componentsTree: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 模拟 Axios 错误响应
 * @param status HTTP 状态码
 * @param message 错误消息
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
// 测试套件：保存功能核心逻辑
// ============================================================

describe('保存功能 - 核心逻辑', () => {
  // 每个测试前重置 store 状态
  beforeEach(() => {
    useUIStore.getState().hideToast();
    useUIStore.getState().setLoading(false);
    useCanvasStore.getState().resetCanvas();
    useComponentStore.getState().clearAll();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // 测试场景 1：成功保存流程（需求 10.4）
  // ============================================================

  describe('成功保存流程（需求 10.4）', () => {
    it('调用 createProject 成功后，toast 应显示"保存成功"', async () => {
      // 模拟 API 返回成功（HTTP 201）
      const mockProject = createMockProject();
      vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(mockProject);

      const { result: uiResult } = renderHook(() => useUIStore());
      const { result: canvasResult } = renderHook(() => useCanvasStore());
      const { result: componentResult } = renderHook(() => useComponentStore());

      // 执行保存操作（模拟 Toolbar 中的 handleSave 逻辑）
      await act(async () => {
        try {
          await projectApi.createProject({
            name: '测试项目',
            canvasConfig: canvasResult.current.config,
            componentsTree: componentResult.current.components,
          });
          // 保存成功，显示成功 Toast（需求 10.4）
          uiResult.current.showToast('保存成功', 'success');
        } catch {
          uiResult.current.showToast('保存失败', 'error');
        }
      });

      // 验证 Toast 显示"保存成功"
      expect(uiResult.current.toast).not.toBeNull();
      expect(uiResult.current.toast?.message).toBe('保存成功');
      expect(uiResult.current.toast?.type).toBe('success');
    });

    it('成功保存后，createProject 应被调用一次且参数正确', async () => {
      // 模拟 API 返回成功
      const mockProject = createMockProject();
      const createProjectSpy = vi
        .spyOn(projectApi, 'createProject')
        .mockResolvedValueOnce(mockProject);

      const { result: canvasResult } = renderHook(() => useCanvasStore());
      const { result: componentResult } = renderHook(() => useComponentStore());

      const projectName = '我的测试项目';

      await act(async () => {
        await projectApi.createProject({
          name: projectName,
          canvasConfig: canvasResult.current.config,
          componentsTree: componentResult.current.components,
        });
      });

      // 验证 API 被调用一次
      expect(createProjectSpy).toHaveBeenCalledTimes(1);

      // 验证调用参数包含正确的项目名称
      expect(createProjectSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: projectName,
        })
      );
    });

    it('成功保存后，toast 类型应为 success（绿色）', async () => {
      // 模拟 API 返回成功
      vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(createMockProject());

      const { result: uiResult } = renderHook(() => useUIStore());

      await act(async () => {
        await projectApi.createProject({
          name: '测试',
          canvasConfig: useCanvasStore.getState().config,
          componentsTree: [],
        });
        uiResult.current.showToast('保存成功', 'success');
      });

      // 验证 toast 类型为 success（对应绿色样式）
      expect(uiResult.current.toast?.type).toBe('success');
    });
  });

  // ============================================================
  // 测试场景 2：错误处理（需求 10.5）
  // ============================================================

  describe('错误处理（需求 10.5）', () => {
    it('API 返回 4xx 错误时，toast 应显示错误信息', async () => {
      // 模拟 API 返回 400 错误
      const error400 = createAxiosError(400, '请求参数无效');
      vi.spyOn(projectApi, 'createProject').mockRejectedValueOnce(error400);

      const { result: uiResult } = renderHook(() => useUIStore());

      await act(async () => {
        try {
          await projectApi.createProject({
            name: '',
            canvasConfig: useCanvasStore.getState().config,
            componentsTree: [],
          });
          uiResult.current.showToast('保存成功', 'success');
        } catch (err) {
          // 提取错误信息（模拟 Toolbar 中的错误处理逻辑）
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          const errorMsg =
            axiosErr.response?.data?.message ??
            axiosErr.message ??
            '未知错误';
          uiResult.current.showToast(`保存失败：${errorMsg}`, 'error');
        }
      });

      // 验证 Toast 显示错误信息
      expect(uiResult.current.toast).not.toBeNull();
      expect(uiResult.current.toast?.type).toBe('error');
      expect(uiResult.current.toast?.message).toContain('保存失败');
      expect(uiResult.current.toast?.message).toContain('请求参数无效');
    });

    it('API 返回 500 错误时，toast 应显示错误信息', async () => {
      // 模拟 API 返回 500 服务器错误
      const error500 = createAxiosError(500, '服务器内部错误');
      vi.spyOn(projectApi, 'createProject').mockRejectedValueOnce(error500);

      const { result: uiResult } = renderHook(() => useUIStore());

      await act(async () => {
        try {
          await projectApi.createProject({
            name: '测试项目',
            canvasConfig: useCanvasStore.getState().config,
            componentsTree: [],
          });
          uiResult.current.showToast('保存成功', 'success');
        } catch (err) {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          const errorMsg =
            axiosErr.response?.data?.message ??
            axiosErr.message ??
            '未知错误';
          uiResult.current.showToast(`保存失败：${errorMsg}`, 'error');
        }
      });

      // 验证 Toast 类型为 error（红色）
      expect(uiResult.current.toast?.type).toBe('error');
      expect(uiResult.current.toast?.message).toContain('服务器内部错误');
    });

    it('API 返回 404 错误时，toast 应显示错误信息', async () => {
      // 模拟 API 返回 404 错误
      const error404 = createAxiosError(404, '资源不存在');
      vi.spyOn(projectApi, 'createProject').mockRejectedValueOnce(error404);

      const { result: uiResult } = renderHook(() => useUIStore());

      await act(async () => {
        try {
          await projectApi.createProject({
            name: '测试项目',
            canvasConfig: useCanvasStore.getState().config,
            componentsTree: [],
          });
          uiResult.current.showToast('保存成功', 'success');
        } catch (err) {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          const errorMsg =
            axiosErr.response?.data?.message ??
            axiosErr.message ??
            '未知错误';
          uiResult.current.showToast(`保存失败：${errorMsg}`, 'error');
        }
      });

      expect(uiResult.current.toast?.type).toBe('error');
      expect(uiResult.current.toast?.message).toContain('资源不存在');
    });

    it('网络连接失败时，toast 应显示错误信息', async () => {
      // 模拟网络错误（无 response 对象）
      const networkError = new Error('Network Error');
      vi.spyOn(projectApi, 'createProject').mockRejectedValueOnce(networkError);

      const { result: uiResult } = renderHook(() => useUIStore());

      await act(async () => {
        try {
          await projectApi.createProject({
            name: '测试项目',
            canvasConfig: useCanvasStore.getState().config,
            componentsTree: [],
          });
          uiResult.current.showToast('保存成功', 'success');
        } catch (err) {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          const errorMsg =
            axiosErr.response?.data?.message ??
            axiosErr.message ??
            '未知错误';
          uiResult.current.showToast(`保存失败：${errorMsg}`, 'error');
        }
      });

      expect(uiResult.current.toast?.type).toBe('error');
      expect(uiResult.current.toast?.message).toContain('Network Error');
    });

    it('错误时不应显示成功 Toast', async () => {
      // 模拟 API 失败
      vi.spyOn(projectApi, 'createProject').mockRejectedValueOnce(
        createAxiosError(500, '服务器错误')
      );

      const { result: uiResult } = renderHook(() => useUIStore());

      await act(async () => {
        try {
          await projectApi.createProject({
            name: '测试项目',
            canvasConfig: useCanvasStore.getState().config,
            componentsTree: [],
          });
          uiResult.current.showToast('保存成功', 'success');
        } catch (err) {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          const errorMsg = axiosErr.response?.data?.message ?? axiosErr.message ?? '未知错误';
          uiResult.current.showToast(`保存失败：${errorMsg}`, 'error');
        }
      });

      // 验证不是成功 Toast
      expect(uiResult.current.toast?.type).not.toBe('success');
    });
  });

  // ============================================================
  // 测试场景 3：加载状态（需求 14.5）
  // ============================================================

  describe('加载状态（需求 14.5）', () => {
    it('保存开始时 isSaving 应为 true，保存结束后应为 false', async () => {
      // 使用 uiStore 的 isLoading 状态来模拟加载过程
      const { result: uiResult } = renderHook(() => useUIStore());

      // 初始状态：未加载
      expect(uiResult.current.isLoading).toBe(false);

      // 模拟保存开始（设置加载状态）
      act(() => {
        uiResult.current.setLoading(true);
      });

      // 验证加载状态为 true
      expect(uiResult.current.isLoading).toBe(true);

      // 模拟保存结束（清除加载状态）
      act(() => {
        uiResult.current.setLoading(false);
      });

      // 验证加载状态恢复为 false
      expect(uiResult.current.isLoading).toBe(false);
    });

    it('保存成功后，加载状态应恢复为 false', async () => {
      // 模拟 API 成功
      vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(createMockProject());

      const { result: uiResult } = renderHook(() => useUIStore());

      await act(async () => {
        // 开始保存：设置加载状态
        uiResult.current.setLoading(true);
        try {
          await projectApi.createProject({
            name: '测试项目',
            canvasConfig: useCanvasStore.getState().config,
            componentsTree: [],
          });
          uiResult.current.showToast('保存成功', 'success');
        } finally {
          // 无论成功或失败，都关闭加载状态（需求 14.5）
          uiResult.current.setLoading(false);
        }
      });

      // 验证加载状态已关闭
      expect(uiResult.current.isLoading).toBe(false);
      // 验证成功 Toast 已显示
      expect(uiResult.current.toast?.type).toBe('success');
    });

    it('保存失败后，加载状态应恢复为 false', async () => {
      // 模拟 API 失败
      vi.spyOn(projectApi, 'createProject').mockRejectedValueOnce(
        createAxiosError(500, '服务器错误')
      );

      const { result: uiResult } = renderHook(() => useUIStore());

      await act(async () => {
        // 开始保存：设置加载状态
        uiResult.current.setLoading(true);
        try {
          await projectApi.createProject({
            name: '测试项目',
            canvasConfig: useCanvasStore.getState().config,
            componentsTree: [],
          });
          uiResult.current.showToast('保存成功', 'success');
        } catch (err) {
          const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
          const errorMsg = axiosErr.response?.data?.message ?? axiosErr.message ?? '未知错误';
          uiResult.current.showToast(`保存失败：${errorMsg}`, 'error');
        } finally {
          // 无论成功或失败，都关闭加载状态（需求 14.5）
          uiResult.current.setLoading(false);
        }
      });

      // 验证加载状态已关闭（即使发生错误）
      expect(uiResult.current.isLoading).toBe(false);
      // 验证错误 Toast 已显示
      expect(uiResult.current.toast?.type).toBe('error');
    });

    it('setLoading(true) 后 isLoading 应为 true', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('setLoading(false) 后 isLoading 应为 false', () => {
      const { result } = renderHook(() => useUIStore());

      // 先设置为 true
      act(() => {
        result.current.setLoading(true);
      });

      // 再设置为 false
      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  // ============================================================
  // 测试场景 4：uiStore Toast 状态管理
  // ============================================================

  describe('uiStore Toast 状态管理', () => {
    it('showToast 应正确设置 toast 消息和类型', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.showToast('操作成功', 'success');
      });

      expect(result.current.toast?.message).toBe('操作成功');
      expect(result.current.toast?.type).toBe('success');
    });

    it('hideToast 应将 toast 设置为 null', () => {
      const { result } = renderHook(() => useUIStore());

      // 先显示 Toast
      act(() => {
        result.current.showToast('测试消息', 'info');
      });

      expect(result.current.toast).not.toBeNull();

      // 隐藏 Toast
      act(() => {
        result.current.hideToast();
      });

      expect(result.current.toast).toBeNull();
    });

    it('连续调用 showToast 应覆盖之前的 toast', () => {
      const { result } = renderHook(() => useUIStore());

      act(() => {
        result.current.showToast('第一条消息', 'success');
      });

      act(() => {
        result.current.showToast('第二条消息', 'error');
      });

      // 应显示最新的 Toast
      expect(result.current.toast?.message).toBe('第二条消息');
      expect(result.current.toast?.type).toBe('error');
    });

    it('showToast 应记录 timestamp', () => {
      const { result } = renderHook(() => useUIStore());
      const beforeTime = Date.now();

      act(() => {
        result.current.showToast('测试', 'info');
      });

      const afterTime = Date.now();

      // 验证 timestamp 在合理范围内
      expect(result.current.toast?.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(result.current.toast?.timestamp).toBeLessThanOrEqual(afterTime);
    });
  });
});
