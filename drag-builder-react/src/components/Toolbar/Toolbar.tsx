/**
 * Toolbar 组件
 * 顶部工具栏，包含 Logo、项目名称、保存按钮和查看代码按钮
 *
 * 需求：9.1, 10.1, 10.2, 10.4, 10.5, 14.5
 * - 9.1: 提供"查看代码"按钮
 * - 10.1: 提供"保存项目"按钮
 * - 10.2: 点击按钮调用 createProject API
 * - 10.4: 保存成功显示绿色 Toast
 * - 10.5: 保存失败显示红色 Toast
 * - 14.5: 保存时显示加载动画
 */

import React, { useState } from 'react';
import type { AxiosError } from 'axios';
import { useUIStore } from '@store/uiStore';
import { useCanvasStore } from '@store/canvasStore';
import { useComponentStore } from '@store/componentStore';
import { createProject } from '@api/projectApi';
import ZoomControl from './ZoomControl';

/**
 * Toolbar 组件属性
 */
interface ToolbarProps {
  projectName?: string; // 项目名称（可选）
}

/**
 * Toolbar 组件
 * 固定在顶部，高度 64px
 * 使用 Linear/Vercel 风格
 */
const Toolbar: React.FC<ToolbarProps> = ({ projectName = '未命名项目' }) => {
  const { openCodePreview, isGridSnapEnabled, toggleGridSnap, showToast } = useUIStore();
  const { config: canvasConfig } = useCanvasStore();
  const { components } = useComponentStore();

  // 本地保存加载状态（独立于全局 isLoading，避免影响其他加载场景）
  const [isSaving, setIsSaving] = useState(false);

  /**
   * 处理保存按钮点击（需求 10.2, 10.4, 10.5, 14.5）
   * 1. 设置加载状态
   * 2. 调用 createProject API
   * 3. 成功显示绿色 Toast，失败显示红色 Toast
   */
  const handleSave = async () => {
    // 防止重复点击
    if (isSaving) return;

    setIsSaving(true);
    try {
      // 调用后端 API 创建项目（需求 10.2）
      await createProject({
        name: projectName,
        canvasConfig,
        componentsTree: components,
      });

      // 保存成功，显示绿色 Toast（需求 10.4）
      showToast('保存成功', 'success');
    } catch (err) {
      // 提取错误信息
      const axiosErr = err as AxiosError<{ message?: string; error?: string }>;
      const errorMsg =
        axiosErr.response?.data?.message ??
        axiosErr.response?.data?.error ??
        axiosErr.message ??
        '未知错误';

      // 保存失败，显示红色 Toast（需求 10.5）
      showToast(`保存失败：${errorMsg}`, 'error');
    } finally {
      // 无论成功或失败，都关闭加载状态
      setIsSaving(false);
    }
  };

  /**
   * 处理查看代码按钮点击
   */
  const handleViewCode = () => {
    openCodePreview();
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 h-16 z-50 
                       bg-white border-b border-slate-200 
                       flex items-center justify-between px-6"
    >
      {/* 左侧：Logo 和项目名称 */}
      <div className="flex items-center gap-4">
        {/* Logo - 波浪渐变动画效果 */}
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
            {/* 波浪渐变背景 - 从左到右，有层次感 */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, #fb923c 0%, #fb923c 10%, #f97316 20%, #f97316 30%, #ea580c 40%, #ea580c 50%, #c2410c 60%, #c2410c 70%, #9a3412 80%, #9a3412 90%, #fb923c 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradient-wave 3s linear infinite',
              }}
            />
            {/* Logo 文字 */}
            <span className="relative z-10 text-white font-bold text-sm drop-shadow-md">DB</span>
          </div>
          <span className="text-lg font-semibold text-slate-900 tracking-tight">DragBuilder</span>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-6 bg-slate-200" />

        {/* 项目名称 */}
        <span className="text-sm text-slate-600">{projectName}</span>
      </div>

      {/* 中间：缩放控制 */}
      <div className="flex items-center">
        <ZoomControl />
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-3">
        {/* 网格吸附按钮 */}
        <button
          onClick={toggleGridSnap}
          className={`px-3 py-2 text-sm font-medium rounded-lg
                     border transition-all duration-200
                     flex items-center gap-2
                     ${
                       isGridSnapEnabled
                         ? 'text-orange-700 bg-orange-50 border-orange-200 hover:bg-orange-100'
                         : 'text-slate-600 bg-white border-slate-200 hover:bg-slate-50'
                     }`}
          title="切换网格吸附 (Ctrl+Shift+G)"
        >
          {/* 网格图标 */}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>

          {/* 状态指示器 */}
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              isGridSnapEnabled ? 'bg-green-500' : 'bg-slate-300'
            }`}
          />

          <span className="hidden sm:inline">网格吸附</span>
        </button>

        {/* 查看代码按钮 */}
        <button
          onClick={handleViewCode}
          className="px-4 py-2 text-sm font-medium text-slate-700 
                     bg-white border border-slate-200 rounded-lg
                     hover:bg-slate-50 hover:border-slate-300
                     transition-colors duration-200
                     flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          查看代码
        </button>

        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-white 
                     bg-orange-600 rounded-lg
                     hover:bg-orange-700
                     disabled:bg-orange-400 disabled:cursor-not-allowed
                     transition-colors duration-200
                     flex items-center gap-2"
        >
          {isSaving ? (
            <>
              {/* 加载动画 */}
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              保存中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              保存项目
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Toolbar;
