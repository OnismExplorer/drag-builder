/**
 * CanvasSizeModal 组件
 * 画布规格选择模态框，提供预设和自定义尺寸选项
 *
 * 需求：1.3, 1.4, 1.5, 1.6
 * - 1.3: 提供四种预设规格选项（手机/平板/桌面/自定义）
 * - 1.4: 自定义选项显示宽高输入框
 * - 1.5: 输入验证（100-5000px）
 * - 1.6: 确认按钮创建画布并跳转到编辑器
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from './Modal';
import { useUIStore } from '@store';
import { useCanvasStore } from '@store';
import { CANVAS_PRESETS, type CanvasPreset } from '@/types';

/**
 * 预设选项配置
 */
interface PresetOption {
  id: CanvasPreset;
  label: string;
  description: string;
  icon: string;
}

/**
 * 预设选项列表
 */
const PRESET_OPTIONS: PresetOption[] = [
  {
    id: 'mobile',
    label: '手机',
    description: '375 × 667 px',
    icon: '📱',
  },
  {
    id: 'tablet',
    label: '平板',
    description: '768 × 1024 px',
    icon: '📱',
  },
  {
    id: 'desktop',
    label: '桌面',
    description: '1440 × 900 px',
    icon: '🖥️',
  },
  {
    id: 'custom',
    label: '自定义',
    description: '自定义尺寸',
    icon: '⚙️',
  },
];

/**
 * 尺寸验证常量
 */
const MIN_SIZE = 100;
const MAX_SIZE = 5000;

/**
 * CanvasSizeModal 组件
 *
 * 特性：
 * - 显示四个预设选项（手机/平板/桌面/自定义）
 * - 自定义选项显示宽高输入框
 * - 输入验证（100-5000px）
 * - 确认按钮创建画布并跳转到编辑器
 */
export const CanvasSizeModal: React.FC = () => {
  const { isCanvasSizeModalOpen, closeCanvasSizeModal } = useUIStore();
  const { setConfig } = useCanvasStore();
  const navigate = useNavigate();

  // 选中的预设
  const [selectedPreset, setSelectedPreset] = useState<CanvasPreset>('desktop');

  // 自定义尺寸
  const [customWidth, setCustomWidth] = useState<string>('800');
  const [customHeight, setCustomHeight] = useState<string>('600');

  // 验证错误
  const [widthError, setWidthError] = useState<string>('');
  const [heightError, setHeightError] = useState<string>('');

  /**
   * 验证尺寸输入
   */
  const validateSize = (value: string, type: 'width' | 'height'): boolean => {
    const num = parseInt(value, 10);

    if (isNaN(num)) {
      const error = '请输入有效的数字';
      if (type === 'width') {
        setWidthError(error);
      } else {
        setHeightError(error);
      }
      return false;
    }

    if (num < MIN_SIZE || num > MAX_SIZE) {
      const error = `尺寸必须在 ${MIN_SIZE}-${MAX_SIZE}px 之间`;
      if (type === 'width') {
        setWidthError(error);
      } else {
        setHeightError(error);
      }
      return false;
    }

    if (type === 'width') {
      setWidthError('');
    } else {
      setHeightError('');
    }
    return true;
  };

  /**
   * 处理宽度输入变化
   */
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomWidth(value);
    if (value) {
      validateSize(value, 'width');
    } else {
      setWidthError('');
    }
  };

  /**
   * 处理高度输入变化
   */
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomHeight(value);
    if (value) {
      validateSize(value, 'height');
    } else {
      setHeightError('');
    }
  };

  /**
   * 处理预设选择
   */
  const handlePresetSelect = (preset: CanvasPreset) => {
    setSelectedPreset(preset);
    // 清除自定义尺寸的错误
    setWidthError('');
    setHeightError('');
  };

  /**
   * 处理确认创建画布
   * 验证输入后创建画布并跳转到编辑器页面
   */
  const handleConfirm = () => {
    let width: number;
    let height: number;

    // 如果是自定义尺寸，需要验证输入
    if (selectedPreset === 'custom') {
      const isWidthValid = validateSize(customWidth, 'width');
      const isHeightValid = validateSize(customHeight, 'height');

      if (!isWidthValid || !isHeightValid) {
        return; // 验证失败，不关闭模态框
      }

      width = parseInt(customWidth, 10);
      height = parseInt(customHeight, 10);
    } else {
      // 使用预设尺寸
      const preset = CANVAS_PRESETS[selectedPreset];
      width = preset.width;
      height = preset.height;
    }

    // 设置画布配置
    setConfig({
      width,
      height,
      preset: selectedPreset,
      backgroundColor: '#FFFFFF',
    });

    // 关闭模态框
    closeCanvasSizeModal();

    // 跳转到编辑器页面
    navigate('/editor');
  };

  /**
   * 处理模态框关闭
   */
  const handleClose = () => {
    // 重置状态
    setSelectedPreset('desktop');
    setCustomWidth('800');
    setCustomHeight('600');
    setWidthError('');
    setHeightError('');
    closeCanvasSizeModal();
  };

  return (
    <Modal isOpen={isCanvasSizeModalOpen} onClose={handleClose} title="选择画布规格" size="medium">
      <div className="space-y-6">
        {/* 预设选项网格 */}
        <div className="grid grid-cols-2 gap-3">
          {PRESET_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => handlePresetSelect(option.id)}
              className={`
                p-4 rounded-xl border-2 transition-all text-left
                ${
                  selectedPreset === option.id
                    ? 'border-orange-600 bg-orange-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 tracking-tight">{option.label}</div>
                  <div className="text-sm text-slate-500 mt-1">{option.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 自定义尺寸输入框 */}
        {selectedPreset === 'custom' && (
          <div className="space-y-4 p-4 bg-slate-50 rounded-xl">
            <div className="text-sm font-medium text-slate-700">自定义尺寸</div>

            <div className="grid grid-cols-2 gap-4">
              {/* 宽度输入 */}
              <div>
                <label htmlFor="canvas-width" className="block text-sm text-slate-600 mb-2">
                  宽度 (px)
                </label>
                <input
                  id="canvas-width"
                  type="number"
                  value={customWidth}
                  onChange={handleWidthChange}
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition-colors
                    ${
                      widthError
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-200 focus:border-orange-600 focus:ring-orange-600'
                    }
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                  `}
                  placeholder="800"
                />
                {widthError && <p className="text-xs text-red-500 mt-1">{widthError}</p>}
              </div>

              {/* 高度输入 */}
              <div>
                <label htmlFor="canvas-height" className="block text-sm text-slate-600 mb-2">
                  高度 (px)
                </label>
                <input
                  id="canvas-height"
                  type="number"
                  value={customHeight}
                  onChange={handleHeightChange}
                  min={MIN_SIZE}
                  max={MAX_SIZE}
                  className={`
                    w-full px-3 py-2 rounded-lg border transition-colors
                    ${
                      heightError
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-200 focus:border-orange-600 focus:ring-orange-600'
                    }
                    focus:outline-none focus:ring-2 focus:ring-opacity-50
                  `}
                  placeholder="600"
                />
                {heightError && <p className="text-xs text-red-500 mt-1">{heightError}</p>}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              尺寸范围：{MIN_SIZE} - {MAX_SIZE} px
            </p>
          </div>
        )}

        {/* 确认按钮 */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium"
          >
            创建画布
          </button>
        </div>
      </div>
    </Modal>
  );
};
