/**
 * ComponentList 组件
 * 显示画布上所有组件的列表，支持点击选中和重命名
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useComponentStore } from '@store/componentStore';
import type { ComponentNode, ComponentType } from '@/types';

/**
 * 组件类型图标映射
 */
const COMPONENT_ICONS: Record<ComponentType, string> = {
  div: '📦',
  button: '🔘',
  text: '📝',
  image: '🖼️',
  input: '📥',
  radio: '🔘',
  checkbox: '☑️',
  tag: '🏷️',
};

/**
 * 组件类型名称映射（中文）
 */
const COMPONENT_TYPE_NAMES: Record<ComponentType, string> = {
  div: '容器',
  button: '按钮',
  text: '文本内容',
  image: '图片',
  input: '输入框',
  radio: '单选框',
  checkbox: '复选框',
  tag: '标签',
};

/**
 * 组件类型英文标签映射
 */
const COMPONENT_TYPE_LABELS: Record<ComponentType, string> = {
  div: 'Div',
  button: 'Button',
  text: 'Text',
  image: 'Image',
  input: 'Input',
  radio: 'Radio',
  checkbox: 'Checkbox',
  tag: 'Tag',
};

/**
 * ComponentList 组件
 */
const ComponentList: React.FC = () => {
  const { components, selectComponent, updateComponent } = useComponentStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  /**
   * 开始编辑组件名称
   */
  const handleStartEdit = useCallback((e: React.MouseEvent, component: ComponentNode) => {
    e.stopPropagation();
    setEditingId(component.id);
    // 使用组件的文本内容作为名称，如果没有则使用类型名
    setEditingName(component.content.text || COMPONENT_TYPE_NAMES[component.type]);
  }, []);

  /**
   * 保存组件名称
   */
  const handleSaveName = useCallback(() => {
    if (editingId && editingName.trim()) {
      updateComponent(editingId, {
        content: {
          text: editingName.trim(),
        },
      });
    }
    setEditingId(null);
    setEditingName('');
  }, [editingId, editingName, updateComponent]);

  /**
   * 取消编辑
   */
  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName('');
  }, []);

  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveName();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveName, handleCancelEdit]
  );

  /**
   * 选中组件
   */
  const handleSelectComponent = useCallback(
    (componentId: string) => {
      selectComponent(componentId);
    },
    [selectComponent]
  );

  /**
   * 按 zIndex 排序组件（从上到下）
   */
  const sortedComponents = useMemo(() => {
    return [...components].sort((a, b) => b.position.zIndex - a.position.zIndex);
  }, [components]);

  return (
    <div className="space-y-2">
      {sortedComponents.map(component => {
        const isEditing = editingId === component.id;
        const displayName = component.content.text || COMPONENT_TYPE_NAMES[component.type];

        return (
          <div
            key={component.id}
            className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200 
                       hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all"
            onClick={() => !isEditing && handleSelectComponent(component.id)}
          >
            {/* 组件图标 */}
            <div
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center 
                            bg-slate-100 rounded-lg text-lg"
            >
              {COMPONENT_ICONS[component.type]}
            </div>

            {/* 组件信息 */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleKeyDown}
                  className="w-full px-2 py-1 text-sm font-medium border border-blue-400 
                             rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <>
                  <div className="text-sm font-medium text-slate-900 truncate">{displayName}</div>
                  <div className="text-xs text-slate-500">
                    {COMPONENT_TYPE_LABELS[component.type]} ·{Math.round(component.position.width)}×
                    {Math.round(component.position.height)} · X:{Math.round(component.position.x)}{' '}
                    Y:{Math.round(component.position.y)}
                  </div>
                </>
              )}
            </div>

            {/* 编辑按钮 */}
            {!isEditing && (
              <button
                onClick={e => handleStartEdit(e, component)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 
                           p-1.5 rounded hover:bg-slate-200 transition-opacity"
                title="重命名"
              >
                <svg
                  className="w-4 h-4 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ComponentList;
