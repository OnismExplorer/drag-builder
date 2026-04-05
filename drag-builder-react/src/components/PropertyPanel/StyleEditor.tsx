/**
 * StyleEditor 组件
 * 样式编辑器
 *
 * 需求：7.6
 * - 颜色选择器（背景色、边框色、文字色）
 * - 预设色板（Slate 系列 + #C2410C）
 * - 调色板（HTML5 Color Picker）
 * - 最近使用的 10 种颜色
 * - 数值输入（边框宽度、圆角、字体大小）
 */

import React, { useEffect, useState } from 'react';
import type { ComponentNode } from '../../types';
import { AdvancedColorPicker } from './AdvancedColorPicker';

interface StyleEditorProps {
  component: ComponentNode;
  onUpdate: (updates: Partial<ComponentNode>) => void;
}

/**
 * 颜色选择器组件
 * 使用高级调色板
 */
interface ColorPickerProps {
  label: string;
  value?: string;
  onChange: (color: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, isOpen, onToggle }) => {
  // 注意：不在这里调用 addColor
  // 颜色历史记录由 AdvancedColorPicker 在关闭时统一处理
  const handleColorChange = (color: string) => {
    onChange(color);
  };

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <button
        onClick={onToggle}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                   hover:border-slate-300 transition-colors flex items-center gap-2"
      >
        <div
          className="w-6 h-6 rounded border border-slate-300"
          style={{ backgroundColor: value || '#FFFFFF' }}
        />
        <span className="text-slate-700">{value || '未设置'}</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 left-0">
          <AdvancedColorPicker
            value={value || '#FFFFFF'}
            onChange={handleColorChange}
            onClose={onToggle}
          />
        </div>
      )}
    </div>
  );
};

/**
 * 数值输入框组件
 * 使用本地状态来避免每次输入都触发全局更新
 */
interface NumberInputProps {
  label: string;
  value?: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value = 0,
  onChange,
  min = 0,
  max = 1000,
  unit = 'px',
}) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
  };

  const handleBlur = () => {
    const numValue = parseFloat(localValue) || 0;
    const clampedValue = Math.max(min, Math.min(max, numValue));

    if (clampedValue !== value) {
      onChange(clampedValue);
    }

    // 更新显示值为实际保存的值
    setLocalValue(clampedValue.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex-1">
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={localValue}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          className="w-full px-3 py-2 pr-8 text-sm border border-slate-200 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
          {unit}
        </span>
      </div>
    </div>
  );
};

/**
 * StyleEditor 组件
 */
const StyleEditor: React.FC<StyleEditorProps> = ({ component, onUpdate }) => {
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const [showTextPicker, setShowTextPicker] = useState(false);

  /**
   * 处理背景色变化
   */
  const handleBackgroundColorChange = (color: string) => {
    onUpdate({
      styles: {
        ...component.styles,
        backgroundColor: color,
      },
    });
  };

  /**
   * 处理边框色变化
   */
  const handleBorderColorChange = (color: string) => {
    onUpdate({
      styles: {
        ...component.styles,
        borderColor: color,
      },
    });
  };

  /**
   * 处理文字色变化
   */
  const handleTextColorChange = (color: string) => {
    onUpdate({
      styles: {
        ...component.styles,
        textColor: color,
      },
    });
  };

  /**
   * 处理边框宽度变化
   */
  const handleBorderWidthChange = (value: number) => {
    onUpdate({
      styles: {
        ...component.styles,
        borderWidth: value,
      },
    });
  };

  /**
   * 处理圆角变化
   */
  const handleBorderRadiusChange = (value: number) => {
    onUpdate({
      styles: {
        ...component.styles,
        borderRadius: value,
      },
    });
  };

  /**
   * 处理字体大小变化
   */
  const handleFontSizeChange = (value: number) => {
    onUpdate({
      styles: {
        ...component.styles,
        fontSize: value,
      },
    });
  };

  /**
   * 处理字体粗细变化
   */
  const handleFontWeightChange = (value: number) => {
    onUpdate({
      styles: {
        ...component.styles,
        fontWeight: value,
      },
    });
  };

  /**
   * 处理内边距变化
   */
  const handlePaddingChange = (value: number) => {
    onUpdate({
      styles: {
        ...component.styles,
        padding: value,
      },
    });
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">样式配置</h3>

      {/* 颜色选择器 */}
      <div className="space-y-3">
        <ColorPicker
          label="背景色"
          value={component.styles.backgroundColor}
          onChange={handleBackgroundColorChange}
          isOpen={showBackgroundPicker}
          onToggle={() => {
            setShowBackgroundPicker(!showBackgroundPicker);
            setShowBorderPicker(false);
            setShowTextPicker(false);
          }}
        />

        <ColorPicker
          label="边框色"
          value={component.styles.borderColor}
          onChange={handleBorderColorChange}
          isOpen={showBorderPicker}
          onToggle={() => {
            setShowBorderPicker(!showBorderPicker);
            setShowBackgroundPicker(false);
            setShowTextPicker(false);
          }}
        />

        <ColorPicker
          label="文字色"
          value={component.styles.textColor}
          onChange={handleTextColorChange}
          isOpen={showTextPicker}
          onToggle={() => {
            setShowTextPicker(!showTextPicker);
            setShowBackgroundPicker(false);
            setShowBorderPicker(false);
          }}
        />
      </div>

      {/* 数值输入 */}
      <div className="flex gap-3">
        <NumberInput
          label="边框宽度"
          value={component.styles.borderWidth}
          onChange={handleBorderWidthChange}
          max={20}
        />
        <NumberInput
          label="圆角"
          value={component.styles.borderRadius}
          onChange={handleBorderRadiusChange}
          max={100}
        />
      </div>

      {/* 文字样式（仅对 text 和 button 类型显示） */}
      {(component.type === 'text' || component.type === 'button') && (
        <>
          <div className="flex gap-3">
            <NumberInput
              label="字体大小"
              value={component.styles.fontSize}
              onChange={handleFontSizeChange}
              min={8}
              max={72}
            />
            <NumberInput
              label="字体粗细"
              value={component.styles.fontWeight}
              onChange={handleFontWeightChange}
              min={100}
              max={900}
              unit=""
            />
          </div>
        </>
      )}

      {/* 内边距 */}
      <NumberInput
        label="内边距"
        value={component.styles.padding}
        onChange={handlePaddingChange}
        max={100}
      />
    </div>
  );
};

export default StyleEditor;
