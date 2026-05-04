/**
 * CodePreview 组件
 * 代码预览窗口，展示生成的 TSX 代码
 *
 * 需求：9.2, 9.3, 9.4, 9.5, 9.6, 9.8
 * - 9.2: 打开 Code_Preview 模态窗口
 * - 9.3: 展示当前画布生成的完整 TSX 代码
 * - 9.4: 使用语法高亮显示代码
 * - 9.5: 提供"复制代码"按钮
 * - 9.6: 复制成功显示 Toast 提示
 * - 9.8: 画布为空时显示空组件模板
 */

import React, { useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Modal } from '@components/Modal/Modal';
import { useUIStore } from '@store/uiStore';
import { useComponentStore } from '@store/componentStore';
import { useCanvasStore } from '@store/canvasStore';
import { codeGenerator } from '@utils/codeGenerator';

/**
 * CodePreview 组件
 *
 * 特性：
 * - 模态窗口展示生成的代码
 * - 使用 react-syntax-highlighter 实现语法高亮
 * - 提供"复制代码"按钮
 * - 复制成功显示 Toast 提示
 * - 空画布显示空组件模板
 */
export const CodePreview: React.FC = () => {
  const { isCodePreviewOpen, closeCodePreview, showToast } = useUIStore();
  const { components } = useComponentStore();
  const { config } = useCanvasStore();

  /**
   * 生成代码
   * 使用 useMemo 缓存生成结果，避免重复计算
   */
  const generatedCode = useMemo(() => {
    return codeGenerator.generateTSXCode(components, config);
  }, [components, config]);

  /**
   * 复制到剪贴板
   * 使用现代 Clipboard API
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      showToast('代码已复制到剪贴板', 'success');
    } catch (error) {
      console.error('复制失败:', error);
      showToast('复制失败，请重试', 'error');
    }
  };

  return (
    <Modal isOpen={isCodePreviewOpen} onClose={closeCodePreview} title="生成的代码" size="large">
      <div className="space-y-4">
        {/* 操作按钮区域 */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {components.length === 0
              ? '画布为空，显示空组件模板'
              : `已生成 ${components.length} 个组件的代码`}
          </p>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg 
                       hover:bg-orange-700 transition-colors
                       flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            复制代码
          </button>
        </div>

        {/* 代码展示区域 */}
        <div className="relative rounded-2xl overflow-hidden">
          <SyntaxHighlighter
            language="tsx"
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '1rem',
              fontSize: '0.875rem',
              maxHeight: '60vh',
            }}
            showLineNumbers={true}
            wrapLines={true}
          >
            {generatedCode}
          </SyntaxHighlighter>
        </div>

        {/* 提示信息 */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>💡 提示：</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>生成的代码使用 React 18 + TypeScript 语法</li>
            <li>样式使用内联样式和 Tailwind CSS 类名</li>
            <li>代码已格式化，可直接使用</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};
