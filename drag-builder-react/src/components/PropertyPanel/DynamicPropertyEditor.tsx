/**
 * 动态属性编辑器
 * 根据 ComponentDefinition.propertyGroups 动态生成属性编辑器
 */

import React, { useCallback, useMemo } from 'react';
import type {
  PropertyDefinition,
  PropertyGroup,
  AnimationPropertyGroup,
  PropertyValue,
} from '../../store/componentRegistry';
import type { AnimationConfig, ComponentNode } from '../../types';
import { getPropertyValue, setPropertyValue } from '../built-in/utils';
import { debounce } from '../../utils/timing';
import { useComponentStore } from '../../store/componentStore';

interface DynamicPropertyEditorProps {
  groups: (PropertyGroup | AnimationPropertyGroup)[];
  component: ComponentNode;
  onUpdate: (updates: Partial<ComponentNode>) => void;
}

/**
 * 颜色预设
 */
const COLOR_PRESETS = [
  // Slate
  { label: 'Slate-50', value: '#F8FAFC' },
  { label: 'Slate-100', value: '#F1F5F9' },
  { label: 'Slate-200', value: '#E2E8F0' },
  { label: 'Slate-300', value: '#CBD5E1' },
  { label: 'Slate-400', value: '#94A3B8' },
  { label: 'Slate-500', value: '#64748B' },
  { label: 'Slate-600', value: '#475569' },
  { label: 'Slate-700', value: '#334155' },
  { label: 'Slate-800', value: '#1E293B' },
  { label: 'Slate-900', value: '#0F172A' },
  // Accent
  { label: 'Orange', value: '#C2410C' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Green', value: '#10B981' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Pink', value: '#EC4899' },
];

/**
 * 防抖更新函数
 */
const createDebouncedUpdater = (
  onUpdate: (updates: Partial<ComponentNode>) => void,
  delay = 300
) => {
  return debounce(onUpdate, delay);
};

/**
 * 属性输入控件
 */
const PropertyInput: React.FC<{
  definition: PropertyDefinition;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
}> = ({ definition, value, onChange }) => {
  switch (definition.type) {
    case 'number':
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(value ?? definition.defaultValue ?? '') as string | number}
            onChange={e => onChange(Number(e.target.value))}
            min={definition.min}
            max={definition.max}
            step={definition.step || 1}
            className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm"
          />
          {definition.suffix && <span className="text-xs text-slate-500">{definition.suffix}</span>}
        </div>
      );

    case 'string':
      return (
        <input
          type="text"
          value={(value ?? definition.defaultValue ?? '') as string}
          onChange={e => onChange(e.target.value)}
          className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
        />
      );

    case 'color':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(value ?? definition.defaultValue ?? '#FFFFFF') as string}
              onChange={e => onChange(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <input
              type="text"
              value={(value ?? definition.defaultValue ?? '') as string}
              onChange={e => onChange(e.target.value)}
              placeholder="#FFFFFF"
              className="flex-1 px-2 py-1 border border-slate-200 rounded text-sm font-mono"
            />
          </div>
          {/* 颜色预设 */}
          <div className="flex flex-wrap gap-1">
            {COLOR_PRESETS.map(preset => (
              <button
                key={preset.value}
                onClick={() => onChange(preset.value)}
                className="w-5 h-5 rounded border border-slate-200 hover:scale-110 transition-transform"
                style={{ backgroundColor: preset.value }}
                title={preset.label}
              />
            ))}
          </div>
        </div>
      );

    case 'select':
      return (
        <select
          value={(value ?? definition.defaultValue ?? '') as string}
          onChange={e => onChange(e.target.value)}
          className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
        >
          {definition.options?.map(opt => (
            <option key={String(opt.value)} value={opt.value as string}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'checkbox':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!(value ?? definition.defaultValue ?? false)}
            onChange={e => onChange(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">{definition.label}</span>
        </label>
      );

    case 'slider':
      return (
        <div className="space-y-1">
          <input
            type="range"
            value={(value ?? definition.defaultValue ?? definition.min ?? 0) as number}
            onChange={e => onChange(Number(e.target.value))}
            min={definition.min}
            max={definition.max}
            step={definition.step || 1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{definition.min}</span>
            <span>{value ?? definition.defaultValue ?? 0}</span>
            <span>{definition.max}</span>
          </div>
        </div>
      );

    default:
      return null;
  }
};

/**
 * 动画预设模板（不含具体值，用于渲染按钮和配置）
 */
interface AnimationPreset {
  id: string;
  label: string;
  icon: string;
  description: string;
  /** 预设的目标值（示例值） */
  defaultValue: number;
  /** 单位 */
  unit: string;
  /** min 值 */
  min: number;
  /** max 值 */
  max: number;
}

/**
 * 预设动画列表
 */
const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'fadeIn',
    label: '淡入',
    icon: '💡',
    description: '渐渐显示出来',
    defaultValue: 1,
    unit: '%',
    min: 0,
    max: 1,
  },
  {
    id: 'fadeOut',
    label: '淡出',
    icon: '🌫️',
    description: '渐渐消失',
    defaultValue: 0,
    unit: '%',
    min: 0,
    max: 1,
  },
  {
    id: 'scaleIn',
    label: '放大',
    icon: '🔍',
    description: '从小变大',
    defaultValue: 100,
    unit: '%',
    min: 30,
    max: 150,
  },
  {
    id: 'scaleOut',
    label: '缩小',
    icon: '🔭',
    description: '从大变小',
    defaultValue: 50,
    unit: '%',
    min: 30,
    max: 150,
  },
  {
    id: 'slideLeft',
    label: '左滑入',
    icon: '👈',
    description: '从左边滑入',
    defaultValue: -50,
    unit: 'px',
    min: -100,
    max: 100,
  },
  {
    id: 'slideRight',
    label: '右滑入',
    icon: '👉',
    description: '从右边滑入',
    defaultValue: 50,
    unit: 'px',
    min: -100,
    max: 100,
  },
  {
    id: 'bounce',
    label: '弹跳',
    icon: '🏀',
    description: '弹跳出现',
    defaultValue: 100,
    unit: '%',
    min: 50,
    max: 150,
  },
  {
    id: 'rotateIn',
    label: '旋转',
    icon: '🌀',
    description: '旋转出现',
    defaultValue: 0,
    unit: '°',
    min: -360,
    max: 360,
  },
];

/**
 * 缓动函数选项
 */
const EASE_OPTIONS = [
  { value: 'easeOut', label: '平滑（推荐）' },
  { value: 'linear', label: '匀速' },
  { value: 'easeIn', label: '先慢后快' },
  { value: 'easeInOut', label: '快慢快' },
  { value: 'back', label: '带回弹' },
  { value: 'bounce', label: '弹跳感' },
];

/**
 * 判断当前选中的预设 ID
 * 通过比较 animation 配置与预设的 defaultValue 来判断
 */
function detectActivePresetId(
  animation: ReturnType<typeof useMemo<Record<string, unknown>>>
): string | null {
  if (!animation) return null;

  const cfg = animation as Record<string, unknown>;
  const id = cfg._activePresetId as string | undefined;
  if (!id) return null;

  // 根据预设配置校验是否匹配
  const preset = ANIMATION_PRESETS.find(p => p.id === id);
  if (!preset) return null;

  // 验证 animate 值是否与预设匹配
  const animate = cfg.animate as Record<string, unknown> | undefined;
  if (!animate) return null;

  // 根据预设的 animate 值判断是否匹配
  // 注意：预设的 animate 值是固定的，不是用户自定义的
  if (id === 'fadeIn') {
    return animate.opacity === 1 ? id : null; // fadeIn 固定是 0->1
  }
  if (id === 'fadeOut') {
    return animate.opacity === 0 ? id : null; // fadeOut 固定是 1->0
  }
  if (id === 'scaleIn') {
    return animate.scale === 1 ? id : null; // scaleIn 固定是 0.1->1
  }
  if (id === 'scaleOut') {
    return animate.scale === 0.5 ? id : null; // scaleOut 固定是 1->0.5
  }
  if (id === 'bounce') {
    return animate.scale === 1 ? id : null; // bounce 固定是 0.1->1
  }
  if (id === 'slideLeft' || id === 'slideRight') {
    return animate.x === 0 ? id : null; // 滑入最终回到 0
  }
  if (id === 'rotateIn') {
    return animate.rotate === 0 ? id : null; // 旋转最终回到 0
  }

  return id;
}

/**
 * 动画属性编辑器
 */
const AnimationPropertyEditor: React.FC<{
  component: ComponentNode;
  onUpdate: (updates: Partial<ComponentNode>) => void;
}> = ({ component }) => {
  // isCustom: 是否在自定义模式
  const [isCustom, setIsCustom] = React.useState(false);

  // 获取 updateComponent 用于立即更新（绕过 debounce）
  const updateComponent = useComponentStore(state => state.updateComponent);

  // 从 component.animation 中读取配置
  const animation = useMemo<AnimationConfig>(
    () =>
      component.animation || {
        animate: { opacity: 1 },
        transition: { duration: 0.5, delay: 0, ease: 'easeOut' },
      },
    [component.animation]
  );

  // 动画状态类型（带具体属性访问）
  const anim = animation as AnimationConfig & {
    _customValues?: Record<string, number>;
    animate: Record<string, number>;
    transition: { duration: number; delay: number; ease: string };
  };

  // 从 _activePresetId 恢复选中状态（解决重新挂载后状态丢失问题）
  const [activePresetId, setActivePresetId] = React.useState<string | null>(() =>
    detectActivePresetId(anim as unknown as Record<string, unknown>)
  );

  /**
   * 应用预设动画
   * @param preset 预设
   * @param customValue 用户输入的自定义值（如果不使用默认值）
   */
  const applyPreset = (preset: AnimationPreset, customValue?: number) => {
    setIsCustom(false);
    const value = customValue ?? preset.defaultValue;
    setActivePresetId(preset.id);

    // 根据预设构建 initial（隐藏状态）和 animate（显示状态）
    const initial: Record<string, number | string> = {};
    let animate: Record<string, number | string> = {};

    switch (preset.id) {
      case 'fadeIn':
        // 组件先完全消失，再渐渐显示
        initial.opacity = 0;
        animate = { opacity: 1 };
        break;
      case 'fadeOut':
        // 组件渐渐消失
        initial.opacity = 1;
        animate = { opacity: 0 };
        break;
      case 'scaleIn':
        // 组件从 10% 缩小变到原尺寸（放大效果）
        initial.scale = 0.1;
        animate = { scale: 1 };
        break;
      case 'scaleOut':
        // 组件从原尺寸缩小到 50%
        initial.scale = 1;
        animate = { scale: 0.5 };
        break;
      case 'slideLeft':
        // 组件先消失在左边位置（opacity: 0），再滑入显示
        initial.x = value;
        initial.opacity = 0;
        animate = { x: 0, opacity: 1 };
        break;
      case 'slideRight':
        // 组件先消失在右边位置（opacity: 0），再滑入显示
        initial.x = value;
        initial.opacity = 0;
        animate = { x: 0, opacity: 1 };
        break;
      case 'bounce':
        // 组件从 10% 弹跳放大到原尺寸
        initial.scale = 0.1;
        animate = { scale: 1 };
        break;
      case 'rotateIn':
        // 组件先消失在旋转位置（opacity: 0），再旋转出现
        initial.rotate = value;
        initial.opacity = 0;
        animate = { rotate: 0, opacity: 1 };
        break;
    }

    // 构建 animation 配置，包含 _activePresetId 用于状态持久化
    const newAnimation: AnimationConfig & {
      _activePresetId?: string;
      _customValues?: Record<string, number>;
    } = {
      _activePresetId: preset.id,
      // 每个预设维护自己的自定义值（避免全局共享导致的混乱）
      _customValues: Object.assign(
        {},
        (anim._customValues as Record<string, number> | undefined) || {},
        { [preset.id]: customValue }
      ),
      initial,
      animate,
      transition: {
        duration: 0.5,
        delay: 0,
        ease: 'easeOut',
      },
    };

    // 使用直接更新（绕过 debounce）确保动画立即生效
    updateComponent(component.id, { animation: newAnimation });
  };

  /**
   * 切换到自定义模式
   */
  const enterCustomMode = () => {
    setIsCustom(true);
    setActivePresetId(null);
  };

  /**
   * 返回预设模式
   */
  const returnToPresets = () => {
    setIsCustom(false);
  };

  /**
   * 动画开关
   * 使用直接更新（绕过 debounce）确保开关立即响应
   */
  const handleToggleAnimation = (enabled: boolean) => {
    setActivePresetId(null);
    setIsCustom(false);
    if (enabled) {
      updateComponent(component.id, {
        animation: {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.5, delay: 0, ease: 'easeOut' },
        },
      });
    } else {
      updateComponent(component.id, { animation: undefined });
    }
  };

  /**
   * 实时更新动画（滑块使用，直接更新无 debounce）
   */
  const handleAnimationChangeImmediate = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (path: string, value: any) => {
      const newAnimation = JSON.parse(JSON.stringify(animation));
      const parts = path.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let obj: any = newAnimation;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;

      // 进入自定义状态
      setActivePresetId(null);
      // 使用直接更新（绕过 debounce）确保滑块变化立即响应
      updateComponent(component.id, { animation: newAnimation });
    },
    [animation, component.id, updateComponent]
  );

  // 当前预设的自定义值（用于渲染输入框）
  // 每个预设维护自己的自定义值，切换预设时显示新预设的默认值
  const getPresetCustomValue = (preset: AnimationPreset): string => {
    const customValues = anim._customValues as Record<string, number> | undefined;
    const val = customValues?.[preset.id];
    if (val !== undefined) return String(val);
    return String(preset.defaultValue);
  };

  // 判断某个预设是否当前选中
  const isPresetActive = (presetId: string): boolean => {
    return activePresetId === presetId && !isCustom;
  };

  return (
    <div className="space-y-4">
      {/* 动画开关 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-700 font-medium">启用动画</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!!component.animation}
            onChange={e => handleToggleAnimation(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
        </label>
      </div>

      {/* 动画已启用，显示预设选择 */}
      {component.animation && (
        <>
          {/* 预设动画网格 */}
          {!isCustom && (
            <div className="space-y-2">
              <div className="text-xs text-slate-500">点击按钮预览（可编辑数值）</div>
              <div className="grid grid-cols-4 gap-2">
                {ANIMATION_PRESETS.map(preset => (
                  <PresetButton
                    key={preset.id}
                    preset={preset}
                    isActive={isPresetActive(preset.id)}
                    customValue={getPresetCustomValue(preset)}
                    onApply={value => applyPreset(preset, value)}
                  />
                ))}
              </div>
              <button
                onClick={enterCustomMode}
                className="text-xs text-blue-500 hover:text-blue-700 mt-1"
              >
                自定义设置 ↓
              </button>
            </div>
          )}

          {/* 自定义模式 */}
          {isCustom && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">自定义设置</span>
                <button
                  onClick={returnToPresets}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  返回预设
                </button>
              </div>

              {/* 透明度 */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  透明度（0% = 完全透明，100% = 完全显示）
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={anim.animate?.opacity ?? 1}
                    onChange={e =>
                      handleAnimationChangeImmediate('animate.opacity', Number(e.target.value))
                    }
                    className="flex-1"
                  />
                  <input
                    type="text"
                    value={Math.round((anim.animate?.opacity ?? 1) * 100)}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) handleAnimationChangeImmediate('animate.opacity', v / 100);
                    }}
                    className="w-14 px-2 py-1 border border-slate-200 rounded text-sm text-right"
                  />
                  <span className="text-xs text-slate-400 w-4">%</span>
                </div>
              </div>

              {/* 大小 */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">大小（相对于原始尺寸）</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0.3}
                    max={1.5}
                    step={0.01}
                    value={anim.animate?.scale ?? 1}
                    onChange={e =>
                      handleAnimationChangeImmediate('animate.scale', Number(e.target.value))
                    }
                    className="flex-1"
                  />
                  <input
                    type="text"
                    value={Math.round((anim.animate?.scale ?? 1) * 100)}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) handleAnimationChangeImmediate('animate.scale', v / 100);
                    }}
                    className="w-14 px-2 py-1 border border-slate-200 rounded text-sm text-right"
                  />
                  <span className="text-xs text-slate-400 w-4">%</span>
                </div>
              </div>

              {/* 左右偏移 */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  左右偏移（负数 = 向左，正数 = 向右）
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={anim.animate?.x ?? 0}
                    onChange={e =>
                      handleAnimationChangeImmediate('animate.x', Number(e.target.value))
                    }
                    className="flex-1"
                  />
                  <input
                    type="text"
                    value={anim.animate?.x ?? 0}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) handleAnimationChangeImmediate('animate.x', v);
                    }}
                    className="w-14 px-2 py-1 border border-slate-200 rounded text-sm text-right"
                  />
                  <span className="text-xs text-slate-400 w-4">px</span>
                </div>
              </div>

              {/* 上下偏移 */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  上下偏移（负数 = 向上，正数 = 向下）
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    step={1}
                    value={anim.animate?.y ?? 0}
                    onChange={e =>
                      handleAnimationChangeImmediate('animate.y', Number(e.target.value))
                    }
                    className="flex-1"
                  />
                  <input
                    type="text"
                    value={anim.animate?.y ?? 0}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) handleAnimationChangeImmediate('animate.y', v);
                    }}
                    className="w-14 px-2 py-1 border border-slate-200 rounded text-sm text-right"
                  />
                  <span className="text-xs text-slate-400 w-4">px</span>
                </div>
              </div>

              {/* 旋转角度 */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  旋转角度（负数 = 逆时针，正数 = 顺时针）
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={-360}
                    max={360}
                    step={1}
                    value={anim.animate?.rotate ?? 0}
                    onChange={e =>
                      handleAnimationChangeImmediate('animate.rotate', Number(e.target.value))
                    }
                    className="flex-1"
                  />
                  <input
                    type="text"
                    value={anim.animate?.rotate ?? 0}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) handleAnimationChangeImmediate('animate.rotate', v);
                    }}
                    className="w-14 px-2 py-1 border border-slate-200 rounded text-sm text-right"
                  />
                  <span className="text-xs text-slate-400 w-4">°</span>
                </div>
              </div>

              {/* 动画速度 */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">动画速度</label>
                <div className="flex gap-2">
                  {[
                    { label: '快 0.3s', value: 0.3 },
                    { label: '中 0.5s', value: 0.5 },
                    { label: '慢 1s', value: 1 },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() =>
                        handleAnimationChangeImmediate('transition.duration', opt.value)
                      }
                      className={`flex-1 py-1.5 px-2 text-xs rounded border transition-colors ${
                        anim.transition?.duration === opt.value
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 缓动效果 */}
              <div>
                <label className="text-xs text-slate-500 block mb-1">动画曲线</label>
                <div className="grid grid-cols-2 gap-1">
                  {EASE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnimationChangeImmediate('transition.ease', opt.value)}
                      className={`py-1.5 px-2 text-xs rounded border transition-colors text-left ${
                        anim.transition?.ease === opt.value
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * 预设按钮组件
 * 显示预设图标 + 可编辑的数值输入框
 */
const PresetButton: React.FC<{
  preset: AnimationPreset;
  isActive: boolean;
  customValue: string;
  onApply: (customValue?: number) => void;
}> = ({ preset, isActive, customValue, onApply }) => {
  const [inputValue, setInputValue] = React.useState(customValue);
  const [isEditing, setIsEditing] = React.useState(false);

  // 当 customValue 变化时同步 inputValue
  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(customValue);
    }
  }, [customValue, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const v = parseFloat(inputValue);
    if (!isNaN(v)) {
      onApply(v);
    } else {
      setInputValue(customValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <button
      onClick={() => {
        if (!isEditing) {
          // 点击按钮：应用预设动画（使用当前输入的值）
          const v = parseFloat(inputValue);
          onApply(isNaN(v) ? undefined : v);
        }
      }}
      onDoubleClick={() => {
        // 双击进入编辑模式
        setIsEditing(true);
      }}
      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center relative ${
        isActive
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'
      }`}
      title={`${preset.description}\n双击编辑数值`}
    >
      <span className="text-lg mb-0.5">{preset.icon}</span>
      <span className={`text-xs ${isActive ? 'text-blue-700 font-medium' : 'text-slate-700'}`}>
        {preset.label}
      </span>
      {/* 可编辑数值显示 */}
      <div className="mt-0.5">
        {isEditing ? (
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            autoFocus
            className="w-10 px-1 py-0.5 text-[10px] border border-blue-400 rounded text-center bg-white"
          />
        ) : (
          <span
            className={`text-[10px] ${isActive ? 'text-blue-500 font-medium' : 'text-slate-400'}`}
            onDoubleClick={e => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {customValue}
            {preset.unit}
          </span>
        )}
      </div>
      {isActive && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
      )}
    </button>
  );
};

/**
 * 动态属性编辑器主组件
 */
export const DynamicPropertyEditor: React.FC<DynamicPropertyEditorProps> = ({
  groups,
  component,
  onUpdate,
}) => {
  const debouncedUpdate = createDebouncedUpdater(onUpdate);

  const handlePropertyChange = useCallback(
    (key: string, value: PropertyValue) => {
      const updates = setPropertyValue(component, key, value);
      debouncedUpdate(updates);
    },
    [component, debouncedUpdate]
  );

  return (
    <div className="space-y-6">
      {groups.map(group => {
        // 动画属性组特殊处理
        if (group.id === 'animation') {
          return (
            <div key={group.id} className="space-y-3">
              <h3 className="text-sm font-medium text-slate-700">{group.label}</h3>
              <AnimationPropertyEditor component={component} onUpdate={onUpdate} />
            </div>
          );
        }

        return (
          <div key={group.id} className="space-y-3">
            <h3 className="text-sm font-medium text-slate-700">{group.label}</h3>
            <div className="space-y-3">
              {group.properties.map(prop => (
                <div key={prop.key}>
                  <label className="block text-xs text-slate-500 mb-1">{prop.label}</label>
                  <PropertyInput
                    definition={prop}
                    value={
                      (getPropertyValue(component, prop.key) ??
                        prop.defaultValue ??
                        '') as PropertyValue
                    }
                    onChange={value => handlePropertyChange(prop.key, value)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
