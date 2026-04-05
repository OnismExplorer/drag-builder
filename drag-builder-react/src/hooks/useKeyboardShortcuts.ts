/**
 * 键盘快捷键 Hook
 * 统一管理编辑器中的所有键盘快捷键
 *
 * 支持的快捷键：
 * - Delete / Backspace：删除选中组件
 * - Ctrl+Z：撤销
 * - Ctrl+Shift+Z：重做
 * - Ctrl+C：复制选中组件
 * - Ctrl+V：粘贴组件
 * - Ctrl+S：保存项目
 *
 * 需求：用户体验
 */

import { useEffect, useRef } from 'react';
import { useComponentStore } from '../store/componentStore';

/**
 * 判断当前焦点是否在输入框中
 * 如果是，则不处理快捷键（避免干扰用户输入）
 */
function isFocusInInput(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    el.getAttribute('contenteditable') === 'true'
  );
}

/**
 * 键盘快捷键 Hook
 * @param onSave 保存项目的回调函数（Ctrl+S 触发）
 */
export function useKeyboardShortcuts(onSave?: () => void) {
  const { deleteSelected, undo, redo, copySelected, pasteComponents } = useComponentStore();

  // 使用 ref 保存最新的 onSave，避免 useEffect 依赖变化
  // 在 useEffect 中更新 ref，避免在渲染阶段直接修改 ref
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果焦点在输入框中，不处理快捷键
      if (isFocusInInput()) return;

      const isCtrl = e.ctrlKey || e.metaKey;

      // Delete / Backspace：删除选中组件
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isCtrl) {
        e.preventDefault();
        deleteSelected();
        return;
      }

      if (isCtrl) {
        switch (e.key.toLowerCase()) {
          // Ctrl+Z：撤销
          case 'z':
            if (e.shiftKey) {
              // Ctrl+Shift+Z：重做
              e.preventDefault();
              redo();
            } else {
              e.preventDefault();
              undo();
            }
            break;

          // Ctrl+C：复制
          case 'c':
            e.preventDefault();
            copySelected();
            break;

          // Ctrl+V：粘贴
          case 'v':
            e.preventDefault();
            pasteComponents();
            break;

          // Ctrl+S：保存
          case 's':
            e.preventDefault();
            onSaveRef.current?.();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, undo, redo, copySelected, pasteComponents]);
}
