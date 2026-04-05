/**
 * PositionEditor 组件
 * 位置和尺寸编辑器
 *
 * 需求：7.5, 14.4
 * - 7.5: 实时更新 Canvas 上的组件渲染
 * - 14.4: 使用防抖优化（300ms）
 */

import React, { useState, useEffect, useRef } from 'react';
import type { ComponentNode } from '../../types';

interface PositionEditorProps {
  component: ComponentNode;
  onUpdate: (updates: Partial<ComponentNode>) => void;
}

/**
 * PositionEditor 组件
 * 输入框：X, Y, Width, Height
 * 实时验证（0-5000）
 */
const PositionEditor: React.FC<PositionEditorProps> = ({ component, onUpdate }) => {
  // 本地状态用于即时显示用户输入
  const [localValues, setLocalValues] = useState({
    x: component.position.x.toFixed(1),
    y: component.position.y.toFixed(1),
    width: component.position.width.toFixed(1),
    height: component.position.height.toFixed(1),
  });

  // 跟踪哪个输入框正在被编辑
  const focusedFieldRef = useRef<string | null>(null);

  // 错误状态
  const [errors, setErrors] = useState({
    x: '',
    y: '',
    width: '',
    height: '',
  });

  /**
   * 当组件位置或尺寸变化时同步本地状态
   * 保留1位小数以提升可读性
   * 只在对应输入框未聚焦时更新，避免打断用户输入
   */
  useEffect(() => {
    setLocalValues(prev => ({
      x: focusedFieldRef.current === 'x' ? prev.x : component.position.x.toFixed(1),
      y: focusedFieldRef.current === 'y' ? prev.y : component.position.y.toFixed(1),
      width: focusedFieldRef.current === 'width' ? prev.width : component.position.width.toFixed(1),
      height:
        focusedFieldRef.current === 'height' ? prev.height : component.position.height.toFixed(1),
    }));
  }, [
    component.position.x,
    component.position.y,
    component.position.width,
    component.position.height,
  ]);

  /**
   * 验证数值（0-5000）
   * 需求：7.5
   */
  const validateValue = (value: string, fieldName: string): boolean => {
    const num = parseFloat(value);

    if (isNaN(num)) {
      setErrors(prev => ({ ...prev, [fieldName]: '请输入有效数字' }));
      return false;
    }

    if (num < 0) {
      setErrors(prev => ({ ...prev, [fieldName]: '值不能小于 0' }));
      return false;
    }

    if (num > 5000) {
      setErrors(prev => ({ ...prev, [fieldName]: '值不能大于 5000' }));
      return false;
    }

    setErrors(prev => ({ ...prev, [fieldName]: '' }));
    return true;
  };

  /**
   * 处理输入框变化（仅更新本地状态）
   */
  const handleChange = (field: 'x' | 'y' | 'width' | 'height', value: string) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 提交更改到 store
   */
  const commitChange = (field: 'x' | 'y' | 'width' | 'height', value: string) => {
    if (validateValue(value, field)) {
      const numValue = parseFloat(value);
      const roundedValue = Math.round(numValue * 10) / 10; // 保留1位小数

      onUpdate({
        position: {
          ...component.position,
          [field]: roundedValue,
        },
      });
    }
  };

  /**
   * 渲染单个输入框
   */
  const renderInputField = (label: string, field: 'x' | 'y' | 'width' | 'height') => (
    <div className="flex-1" key={field}>
      <label className="block text-xs font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="number"
        step="0.1"
        value={localValues[field]}
        onChange={e => handleChange(field, e.target.value)}
        onFocus={() => {
          focusedFieldRef.current = field;
        }}
        onBlur={e => {
          focusedFieldRef.current = null;
          commitChange(field, e.target.value);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.currentTarget.blur(); // 触发 onBlur
          }
        }}
        className={`w-full px-3 py-2 text-sm border rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-orange-500
                   ${errors[field] ? 'border-red-500' : 'border-slate-200'}`}
      />
      {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">位置与尺寸</h3>

      {/* X 和 Y 坐标 */}
      <div className="flex gap-3">
        {renderInputField('X', 'x')}
        {renderInputField('Y', 'y')}
      </div>

      {/* 宽度和高度 */}
      <div className="flex gap-3">
        {renderInputField('宽度', 'width')}
        {renderInputField('高度', 'height')}
      </div>
    </div>
  );
};

export default PositionEditor;
