/**
 * ContentEditor 组件
 * 内容编辑器
 *
 * 需求：7.4
 * - 文本输入框（Text/Button 组件）
 * - URL 输入框（Image 组件）
 * - 占位符输入框（Input 组件）
 */

import React, { useState, useEffect } from 'react';
import type { ComponentNode } from '@/types';

interface ContentEditorProps {
  component: ComponentNode;
  onUpdate: (updates: Partial<ComponentNode>) => void;
}

/**
 * 文本输入框组件
 * 使用本地状态来避免每次输入都触发全局更新，在失去焦点时才同步
 */
interface TextInputProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  value = '',
  onChange,
  placeholder,
  multiline = false,
}) => {
  // 本地状态，用于即时响应用户输入
  const [localValue, setLocalValue] = useState(value);

  // 当外部 value 变化时（例如选择了不同的组件），更新本地状态
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /**
   * 处理输入变化 - 只更新本地状态
   */
  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
  };

  /**
   * 处理失去焦点 - 同步到全局状态
   */
  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  /**
   * 处理按键 - 支持 Enter 键立即保存（单行输入框）
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      if (localValue !== value) {
        onChange(localValue);
      }
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      {multiline ? (
        <textarea
          value={localValue}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      )}
    </div>
  );
};

/**
 * ContentEditor 组件
 */
const ContentEditor: React.FC<ContentEditorProps> = ({ component, onUpdate }) => {
  /**
   * 处理文本内容变化
   */
  const handleTextChange = (text: string) => {
    onUpdate({
      content: {
        ...component.content,
        text,
      },
    });
  };

  /**
   * 处理图片 URL 变化
   */
  const handleSrcChange = (src: string) => {
    onUpdate({
      content: {
        ...component.content,
        src,
      },
    });
  };

  /**
   * 处理图片替代文本变化
   */
  const handleAltChange = (alt: string) => {
    onUpdate({
      content: {
        ...component.content,
        alt,
      },
    });
  };

  /**
   * 处理占位符变化
   */
  const handlePlaceholderChange = (placeholder: string) => {
    onUpdate({
      content: {
        ...component.content,
        placeholder,
      },
    });
  };

  /**
   * 处理选项变化
   */
  const handleOptionLabelChange = (optionId: string, newLabel: string) => {
    const updatedOptions = component.content.options?.map(opt =>
      opt.id === optionId ? { ...opt, label: newLabel } : opt
    );
    onUpdate({
      content: {
        ...component.content,
        options: updatedOptions,
      },
    });
  };

  /**
   * 添加新选项
   */
  const handleAddOption = () => {
    const newOption = {
      id: `option-${Date.now()}`,
      label: `选项 ${(component.content.options?.length || 0) + 1}`,
      checked: false,
      disabled: false,
    };
    onUpdate({
      content: {
        ...component.content,
        options: [...(component.content.options || []), newOption],
      },
    });
  };

  /**
   * 删除选项
   */
  const handleRemoveOption = (optionId: string) => {
    const updatedOptions = component.content.options?.filter(opt => opt.id !== optionId);
    onUpdate({
      content: {
        ...component.content,
        options: updatedOptions,
      },
    });
  };

  /**
   * 切换选项禁用状态
   */
  const handleToggleDisabled = (optionId: string) => {
    const updatedOptions = component.content.options?.map(opt =>
      opt.id === optionId ? { ...opt, disabled: !opt.disabled } : opt
    );
    onUpdate({
      content: {
        ...component.content,
        options: updatedOptions,
      },
    });
  };

  /**
   * 根据组件类型渲染不同的内容编辑器
   */
  const renderContentEditor = () => {
    switch (component.type) {
      case 'text':
        return (
          <TextInput
            label="文本内容"
            value={component.content.text}
            onChange={handleTextChange}
            placeholder="输入文本内容"
            multiline
          />
        );

      case 'button':
        return (
          <TextInput
            label="按钮文字"
            value={component.content.text}
            onChange={handleTextChange}
            placeholder="输入按钮文字"
          />
        );

      case 'image':
        return (
          <div className="space-y-3">
            <TextInput
              label="图片 URL"
              value={component.content.src}
              onChange={handleSrcChange}
              placeholder="https://example.com/image.jpg"
            />
            <TextInput
              label="替代文本"
              value={component.content.alt}
              onChange={handleAltChange}
              placeholder="图片描述"
            />
          </div>
        );

      case 'input':
        return (
          <TextInput
            label="占位符"
            value={component.content.placeholder}
            onChange={handlePlaceholderChange}
            placeholder="输入占位符文本"
          />
        );

      case 'radio':
      case 'checkbox': {
        const minOptions = component.type === 'radio' ? 1 : 2;
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">选项列表</label>
              <button
                onClick={handleAddOption}
                className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              >
                + 添加选项
              </button>
            </div>

            <div className="space-y-2">
              {component.content.options?.map((option, index) => (
                <div key={option.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-6">{index + 1}.</span>
                    <div className="flex-1">
                      <TextInput
                        label=""
                        value={option.label}
                        onChange={newLabel => handleOptionLabelChange(option.id, newLabel)}
                        placeholder={`选项 ${index + 1}`}
                      />
                    </div>
                    {(component.content.options?.length || 0) > minOptions && (
                      <button
                        onClick={() => handleRemoveOption(option.id)}
                        className="px-2 py-2 text-xs text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                        title="删除选项"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-8">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={option.disabled || false}
                        onChange={() => handleToggleDisabled(option.id)}
                        className="w-3 h-3 text-orange-500 rounded focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-xs text-slate-600">禁用此选项</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-500">
              {component.type === 'radio'
                ? '单选：只能选择一个选项（最少1个）'
                : '多选：可以选择多个选项（最少2个）'}
            </p>
          </div>
        );
      }

      case 'tag':
        return (
          <TextInput
            label="标签文本"
            value={component.content.text}
            onChange={handleTextChange}
            placeholder="输入标签文本"
          />
        );

      case 'div':
        return <p className="text-xs text-slate-500">容器组件没有可编辑的内容</p>;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">内容配置</h3>

      {renderContentEditor()}
    </div>
  );
};

export default ContentEditor;
