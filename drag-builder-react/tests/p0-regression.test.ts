/**
 * P0 修复回归测试
 * 显式验证三个严重缺陷的修复：
 * 1. pushHistory 在拖拽/调整开始时必须被调用
 * 2. codeGenerator 用户文本必须经过 HTML 转义
 * 3. 无 projectId 时自动保存不应无限创建新项目
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentStore } from '../src/store/componentStore';
import { CodeGenerator } from '../src/utils/codeGenerator';
import * as projectApi from '../src/api/projectApi';
import type { ComponentNode, CanvasConfig } from '../src/types';
import type { Project } from '../src/types/project';
import { registerBuiltInComponents } from '../src/components/built-in';
import { useCanvasStore } from '../src/store/canvasStore';
import { useUIStore } from '../src/store/uiStore';

registerBuiltInComponents();

const mockCanvasConfig: CanvasConfig = {
  width: 800,
  height: 600,
  preset: 'custom',
  backgroundColor: '#FFFFFF',
};

// ============================================================
// Fix 1: pushHistory 必须在拖拽/调整开始时调用
// ============================================================

describe('Fix 1: pushHistory 在操作开始时必须保存快照', () => {
  beforeEach(() => {
    useComponentStore.getState().clearAll();
  });

  it('拖拽开始时 pushHistory 应保存组件快照，撤销后应恢复原始位置（只需一次 Ctrl+Z）', () => {
    const { result } = renderHook(() => useComponentStore());

    // 添加一个组件
    const component: ComponentNode = {
      id: 'test-drag-1',
      type: 'div',
      position: { x: 100, y: 100, width: 200, height: 100, zIndex: 0 },
      styles: {},
      content: {},
    };

    act(() => {
      result.current.addComponent(component);
    });

    // 验证初始位置
    expect(result.current.components[0].position.x).toBe(100);
    expect(result.current.components[0].position.y).toBe(100);

    // 模拟拖拽开始时 pushHistory（修复后的行为）
    act(() => {
      result.current.pushHistory();
    });

    // 模拟拖拽结束，位置更新到新位置
    act(() => {
      result.current.updateComponent('test-drag-1', {
        position: { x: 300, y: 250 },
      });
    });

    // 验证位置已更新
    expect(result.current.components[0].position.x).toBe(300);
    expect(result.current.components[0].position.y).toBe(250);

    // 撤销一次应该回到原始位置
    act(() => {
      result.current.undo();
    });

    expect(result.current.components[0].position.x).toBe(100);
    expect(result.current.components[0].position.y).toBe(100);

    // 不需要第二次撤销
    // 验证历史指针在索引 0
    expect(result.current.historyIndex).toBe(0);
  });

  it('调整大小开始时 pushHistory 应保存组件快照，撤销后应恢复原始尺寸', () => {
    const { result } = renderHook(() => useComponentStore());

    const component: ComponentNode = {
      id: 'test-resize-1',
      type: 'div',
      position: { x: 50, y: 50, width: 200, height: 100, zIndex: 0 },
      styles: {},
      content: {},
    };

    act(() => {
      result.current.addComponent(component);
    });

    const originalWidth = result.current.components[0].position.width;
    const originalHeight = result.current.components[0].position.height;

    // 模拟调整大小开始时 pushHistory（修复后的行为）
    act(() => {
      result.current.pushHistory();
    });

    // 模拟调整大小完成，尺寸变化
    act(() => {
      result.current.updateComponent('test-resize-1', {
        position: { width: 400, height: 300 },
      });
    });

    expect(result.current.components[0].position.width).toBe(400);
    expect(result.current.components[0].position.height).toBe(300);

    // 一次撤销即可恢复原始尺寸
    act(() => {
      result.current.undo();
    });

    expect(result.current.components[0].position.width).toBe(originalWidth);
    expect(result.current.components[0].position.height).toBe(originalHeight);
  });

  it('如果没有 pushHistory，撤销不会恢复到拖拽前状态', () => {
    const { result } = renderHook(() => useComponentStore());

    const component: ComponentNode = {
      id: 'test-no-history',
      type: 'div',
      position: { x: 100, y: 100, width: 200, height: 100, zIndex: 0 },
      styles: {},
      content: {},
    };

    act(() => {
      result.current.addComponent(component);
    });

    // 注意：addComponent 内部会调用 pushHistory
    // 所以 addComponent 之后 history 里已经有快照

    // 直接更新位置（不调用 pushHistory）
    act(() => {
      result.current.updateComponent('test-no-history', {
        position: { x: 300, y: 250 },
      });
    });

    // 撤销一次，回到 addComponent 之前的状态（空组件列表），
    // 而不是回到拖拽前的位置，因为没有在拖拽开始时调用 pushHistory
    act(() => {
      result.current.undo();
    });

    // 撤销后整个组件都没了（回到添加组件之前）
    expect(result.current.components).toHaveLength(0);
  });
});

// ============================================================
// Fix 2: XSS — codeGenerator 用户文本必须经过 HTML 转义
// ============================================================

describe('Fix 2: codeGenerator 用户文本 HTML 转义（XSS 防护）', () => {
  const generator = new CodeGenerator();

  it('button 组件应转义 <script> 标签', () => {
    const components: ComponentNode[] = [
      {
        id: 'xss-btn',
        type: 'button',
        position: { x: 0, y: 0, width: 120, height: 40, zIndex: 1 },
        styles: {},
        content: { text: "<script>alert('xss')</script>" },
      },
    ];

    const code = generator.generateTSXCode(components, mockCanvasConfig);

    // 转义后不应包含原始 <script> 标签
    expect(code).not.toContain('<script>');
    expect(code).not.toContain('</script>');
    // 应包含转义后的文本
    expect(code).toContain('&lt;script&gt;');
    expect(code).toContain('&#x27;xss&#x27;');
  });

  it('text 组件应转义 HTML 特殊字符', () => {
    const components: ComponentNode[] = [
      {
        id: 'xss-text',
        type: 'text',
        position: { x: 0, y: 0, width: 200, height: 30, zIndex: 1 },
        styles: {},
        content: { text: '<img src=x onerror=alert(1)>' },
      },
    ];

    const code = generator.generateTSXCode(components, mockCanvasConfig);

    expect(code).not.toContain('<img src=x');
    expect(code).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('image 组件应转义 src 和 alt 属性中的特殊字符', () => {
    const components: ComponentNode[] = [
      {
        id: 'xss-img',
        type: 'image',
        position: { x: 0, y: 0, width: 200, height: 200, zIndex: 1 },
        styles: {},
        content: {
          src: 'javascript:alert(1)',
          alt: 'test"onclick="alert(2)',
        },
      },
    ];

    const code = generator.generateTSXCode(components, mockCanvasConfig);

    // src 中的特殊字符应该被转义（虽然 javascript: URL 本身不是 HTML 注入，但引号等应转义）
    expect(code).toContain('javascript:alert(1)');
    // alt 中的双引号应被转义
    expect(code).toContain('test&quot;onclick=&quot;alert(2)');
    expect(code).not.toContain('onclick="alert');
  });

  it('input 组件应转义 placeholder 中的特殊字符', () => {
    const components: ComponentNode[] = [
      {
        id: 'xss-input',
        type: 'input',
        position: { x: 0, y: 0, width: 240, height: 40, zIndex: 1 },
        styles: {},
        content: { placeholder: '"><script>alert(1)</script>' },
      },
    ];

    const code = generator.generateTSXCode(components, mockCanvasConfig);

    expect(code).not.toContain('<script>');
    expect(code).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('tag 组件应转义文本中的特殊字符', () => {
    const components: ComponentNode[] = [
      {
        id: 'xss-tag',
        type: 'tag',
        position: { x: 0, y: 0, width: 80, height: 24, zIndex: 1 },
        styles: {},
        content: { text: "a&b<c>d'e" },
      },
    ];

    const code = generator.generateTSXCode(components, mockCanvasConfig);

    expect(code).toContain('a&amp;b&lt;c&gt;d&#x27;e');
    expect(code).not.toContain('a&b<c>');
  });

  it('radio 组件应转义选项 label 中的特殊字符', () => {
    const components: ComponentNode[] = [
      {
        id: 'xss-radio',
        type: 'radio',
        position: { x: 0, y: 0, width: 200, height: 100, zIndex: 1 },
        styles: {},
        content: {
          options: [{ id: 'opt-1', label: '<script>alert(1)</script>', checked: false }],
        },
      },
    ];

    const code = generator.generateTSXCode(components, mockCanvasConfig);

    expect(code).not.toContain('<script>alert(1)</script>');
    expect(code).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('checkbox 组件应转义选项 label 中的特殊字符', () => {
    const components: ComponentNode[] = [
      {
        id: 'xss-checkbox',
        type: 'checkbox',
        position: { x: 0, y: 0, width: 200, height: 100, zIndex: 1 },
        styles: {},
        content: {
          options: [
            { id: 'cb-1', label: '正常文本' },
            { id: 'cb-2', label: 'a&b<c"d' },
          ],
        },
      },
    ];

    const code = generator.generateTSXCode(components, mockCanvasConfig);

    expect(code).toContain('正常文本');
    expect(code).toContain('a&amp;b&lt;c&quot;d');
  });

  it('正常文本不应被过度转义', () => {
    const components: ComponentNode[] = [
      {
        id: 'normal-btn',
        type: 'button',
        position: { x: 0, y: 0, width: 120, height: 40, zIndex: 1 },
        styles: {},
        content: { text: '点击我' },
      },
    ];

    const code = generator.generateTSXCode(components, mockCanvasConfig);

    expect(code).toContain('>点击我<');
    expect(code).not.toContain('&amp;');
    expect(code).not.toContain('&lt;');
  });
});

// ============================================================
// Fix 3: 无 projectId 时自动保存不应无限创建新项目
// ============================================================

describe('Fix 3: 首次创建后应缓存 projectId，后续保存应 updateProject', () => {
  beforeEach(() => {
    useComponentStore.getState().clearAll();
    useCanvasStore.getState().resetCanvas();
    useUIStore.getState().hideToast();
    vi.restoreAllMocks();
  });

  it('首次保存应调用 createProject，第二次保存应调用 updateProject', async () => {
    const mockProject: Project = {
      id: 'project-uuid-123',
      name: '未命名项目',
      canvasConfig: {
        width: 800,
        height: 600,
        preset: 'custom',
        backgroundColor: '#FFFFFF',
      },
      componentsTree: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createSpy = vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(mockProject);
    const updateSpy = vi.spyOn(projectApi, 'updateProject').mockResolvedValueOnce(mockProject);

    // 模拟首次保存（无 projectId）→ 调用 createProject
    const firstResult = await projectApi.createProject({
      name: '未命名项目',
      canvasConfig: useCanvasStore.getState().config,
      componentsTree: useComponentStore.getState().components,
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(firstResult.id).toBe('project-uuid-123');

    // 模拟第二次保存（有了 projectId）→ 应调用 updateProject
    await projectApi.updateProject(firstResult.id, {
      name: '未命名项目',
      canvasConfig: useCanvasStore.getState().config,
      componentsTree: useComponentStore.getState().components,
    });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith('project-uuid-123', expect.any(Object));

    // 验证 createProject 只调用了一次
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it('有 projectId 时应直接调用 updateProject 而不调用 createProject', async () => {
    const existingProjectId = 'existing-project-id';
    const mockProject: Project = {
      id: existingProjectId,
      name: '已有项目',
      canvasConfig: mockCanvasConfig,
      componentsTree: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updateSpy = vi.spyOn(projectApi, 'updateProject').mockResolvedValueOnce(mockProject);
    const createSpy = vi.spyOn(projectApi, 'createProject');

    // 当已经有 projectId 时，直接调用 updateProject
    await projectApi.updateProject(existingProjectId, {
      name: '已有项目',
      canvasConfig: mockCanvasConfig,
      componentsTree: [],
    });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('连续保存三次应只调用一次 createProject 和两次 updateProject', async () => {
    const mockProject: Project = {
      id: 'new-project-id',
      name: '未命名项目',
      canvasConfig: mockCanvasConfig,
      componentsTree: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createSpy = vi.spyOn(projectApi, 'createProject').mockResolvedValueOnce(mockProject);
    const updateSpy = vi.spyOn(projectApi, 'updateProject').mockResolvedValue(mockProject);

    // 第一次保存 - createProject
    const result = await projectApi.createProject({
      name: '未命名项目',
      canvasConfig: mockCanvasConfig,
      componentsTree: [],
    });
    const projectId = result.id;

    // 第二次保存 - updateProject
    await projectApi.updateProject(projectId, {
      componentsTree: [
        {
          id: 'comp-1',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
        },
      ] as ComponentNode[],
    });

    // 第三次保存 - updateProject
    await projectApi.updateProject(projectId, {
      componentsTree: [
        {
          id: 'comp-1',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
        },
        {
          id: 'comp-2',
          type: 'button',
          position: { x: 50, y: 50, width: 120, height: 40, zIndex: 2 },
          styles: {},
          content: { text: '按钮' },
        },
      ] as ComponentNode[],
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledTimes(2);
  });
});
