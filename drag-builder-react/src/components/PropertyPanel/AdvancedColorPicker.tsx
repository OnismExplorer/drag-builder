/**
 * AdvancedColorPicker 高级调色板组件
 *
 * 功能：
 * - 单色/渐变色切换
 * - 饱和度-亮度选择区域
 * - 色相滑块
 * - 透明度滑块
 * - HEX/RGB 格式输入
 * - 渐变色锚点管理
 *
 * 优化：
 * - 修正 HSB 渲染逻辑
 * - 渐变锚点状态管理
 * - 底部输入框布局优化
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useColorHistoryStore } from '@store/colorHistoryStore';

interface AdvancedColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  onClose?: () => void;
}

interface ColorStop {
  id: number;
  offset: number; // 0-100
  color: string;
}

// --- 辅助工具函数 ---
const hsbToRgb = (h: number, s: number, v: number) => {
  s /= 100;
  v /= 100;
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const mod = i % 6;
  const r = [v, q, p, p, t, v][mod];
  const g = [t, v, v, q, p, p][mod];
  const b = [p, p, t, v, v, q][mod];
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

const toRgba = (r: number, g: number, b: number, a: number) => `rgba(${r}, ${g}, ${b}, ${a / 100})`;

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
};

const rgbToHsb = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  const s = max === 0 ? 0 : d / max,
    v = max;
  let h = 0;
  if (max !== min) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
};

/**
 * AdvancedColorPicker 组件
 */
export const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({
  value,
  onChange,
  onClose,
}) => {
  const { recentColors, addColor } = useColorHistoryStore();

  // 1. 使用 Ref 记录打开调色板时的初始值
  const initialValueRef = useRef(value);

  // 使用 Ref 引用最新的 value，避免 useEffect 频繁卸载重装
  const currentValueRef = useRef(value);

  useEffect(() => {
    currentValueRef.current = value;
  }, [value]);
  const [mode, setMode] = useState<'solid' | 'gradient'>(() =>
    value?.startsWith('linear-gradient') ? 'gradient' : 'solid'
  );

  // 追踪上一次 value，用于在渲染期间同步 mode（避免在 effect 中调用 setState）
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    const newMode = value?.startsWith('linear-gradient') ? 'gradient' : 'solid';
    if (newMode !== mode) {
      setMode(newMode);
    }
  }

  // 颜色状态
  const [hsb, setHsb] = useState({ h: 200, s: 80, v: 90 });
  const [alpha, setAlpha] = useState(100);

  // 渐变状态
  const [stops, setStops] = useState<ColorStop[]>([
    { id: 1, offset: 0, color: 'rgba(16, 142, 233, 1)' },
    { id: 2, offset: 100, color: 'rgba(114, 193, 64, 1)' },
  ]);
  const [activeStopId, setActiveStopId] = useState<number>(1);

  const saturationRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);

  // 当 value 改变时，在渲染期间同步颜色状态（React 推荐的 getDerivedStateFromProps 替代方案）
  // 避免在 effect 中调用 setState 导致的级联渲染问题
  if (prevValue !== value && value) {
    if (value.startsWith('linear-gradient')) {
      // 解析渐变色（简化处理，提取颜色停止点）
      const colorMatches = Array.from(value.matchAll(/rgba?\([\d\s,]+\)/g));
      if (colorMatches.length >= 2) {
        const newStops = colorMatches.map((match, index) => ({
          id: index + 1,
          offset: index === 0 ? 0 : 100,
          color: match[0],
        }));
        setStops(newStops);
        // 解析第一个颜色作为当前颜色
        const firstColor = colorMatches[0][0];
        const rgbaMatch = firstColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (rgbaMatch) {
          const r = parseInt(rgbaMatch[1]);
          const g = parseInt(rgbaMatch[2]);
          const b = parseInt(rgbaMatch[3]);
          const a = rgbaMatch[4] ? Math.round(parseFloat(rgbaMatch[4]) * 100) : 100;
          setHsb(rgbToHsb(r, g, b));
          setAlpha(a);
        }
      }
    } else {
      // 单色模式：解析 rgba 格式
      const rgbaMatch = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (rgbaMatch) {
        const r = parseInt(rgbaMatch[1]);
        const g = parseInt(rgbaMatch[2]);
        const b = parseInt(rgbaMatch[3]);
        const a = rgbaMatch[4] ? Math.round(parseFloat(rgbaMatch[4]) * 100) : 100;
        setHsb(rgbToHsb(r, g, b));
        setAlpha(a);
      } else {
        // 解析 HEX 格式
        const rgb = hexToRgb(value);
        if (rgb) {
          setHsb(rgbToHsb(rgb.r, rgb.g, rgb.b));
          setAlpha(100);
        }
      }
    }
  }

  // 1. 解决饱和度不准确问题：修正纯色渲染背景
  const pureHueColor = useMemo(() => {
    const rgb = hsbToRgb(hsb.h, 100, 100);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }, [hsb.h]);

  // 核心逻辑：获取当前 HSB 对应的 RGBA 字符串
  const getCurrentColorRgba = (customHsb = hsb, customAlpha = alpha) => {
    const { r, g, b } = hsbToRgb(customHsb.h, customHsb.s, customHsb.v);
    return toRgba(r, g, b, customAlpha);
  };

  // 2. 更新颜色逻辑：修复饱和度不起效的问题
  const updateCurrentColor = (
    newHsb: { h: number; s: number; v: number },
    newAlpha: number = alpha
  ) => {
    setHsb(newHsb);
    setAlpha(newAlpha);
    const rgba = getCurrentColorRgba(newHsb, newAlpha);

    if (mode === 'solid') {
      onChange(rgba);
    } else {
      // 渐变模式下，更新当前选中的锚点
      const newStops = stops.map(s => (s.id === activeStopId ? { ...s, color: rgba } : s));
      setStops(newStops);
      const gradientStr = `linear-gradient(to right, ${newStops.map(s => `${s.color} ${s.offset}%`).join(', ')})`;
      onChange(gradientStr);
    }
  };

  // 切换锚点时，要把锚点的颜色同步回调色板的状态（hsb 和 alpha）
  const handleStopClick = (stop: ColorStop) => {
    setActiveStopId(stop.id);
    // 从 rgba 字符串中解析出 hsb 和 alpha
    const match = stop.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const a = match[4] ? Math.round(parseFloat(match[4]) * 100) : 100;
      setHsb(rgbToHsb(r, g, b));
      setAlpha(a);
    }
  };

  // 辅助函数：将任何格式的单色解析并同步到 HSB 和 Alpha 状态
  const applySolidColorToInternalState = (colorStr: string) => {
    const rgbaMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1]);
      const g = parseInt(rgbaMatch[2]);
      const b = parseInt(rgbaMatch[3]);
      const a = rgbaMatch[4] ? Math.round(parseFloat(rgbaMatch[4]) * 100) : 100;
      setHsb(rgbToHsb(r, g, b));
      setAlpha(a);
    } else {
      const rgb = hexToRgb(colorStr);
      if (rgb) {
        setHsb(rgbToHsb(rgb.r, rgb.g, rgb.b));
        setAlpha(100);
      }
    }
  };

  // 统一的应用颜色函数（用于最近使用颜色）
  const handleColorApply = (colorStr: string) => {
    if (!colorStr) return;

    // 情况 A: 点击的是渐变色
    if (colorStr.startsWith('linear-gradient')) {
      setMode('gradient');

      // 优化的渐变色解析：支持位置偏移
      // 匹配格式：rgba(r,g,b,a) 或 #RRGGBB，后面可能跟着百分比
      const colorMatches = Array.from(
        colorStr.matchAll(/(?:rgba?\([\d\s,.]+\)|#[0-9A-Fa-f]{6})\s*(\d+%)?/g)
      );

      if (colorMatches.length >= 2) {
        const newStops = colorMatches.map((match, index) => {
          const colorPart = match[0].split(/\s+/)[0]; // 提取颜色部分
          const offsetPart = match[1]; // 提取位置部分（如果有）

          return {
            id: index + 1,
            // 如果有明确的位置，使用它；否则使用默认值
            offset: offsetPart ? parseInt(offsetPart) : index === 0 ? 0 : 100,
            color: colorPart,
          };
        });

        setStops(newStops);
        setActiveStopId(1); // 默认选中第一个点
        // 解析第一个点到 HSB 状态
        applySolidColorToInternalState(newStops[0].color);
      }
      onChange(colorStr);
    }
    // 情况 B: 点击的是单色
    else {
      applySolidColorToInternalState(colorStr);

      if (mode === 'solid') {
        // 纯色模式：直接更新
        onChange(colorStr);
      } else {
        // 渐变模式：更新当前选中的锚点，而不是破坏整个渐变
        const newStops = stops.map(s => (s.id === activeStopId ? { ...s, color: colorStr } : s));
        setStops(newStops);
        const gradientStr = `linear-gradient(to right, ${newStops.map(s => `${s.color} ${s.offset}%`).join(', ')})`;
        onChange(gradientStr);
      }
    }

    // 注意：点击历史颜色不需要再次 addColor，因为它已经在历史里了
  };

  // 拖拽处理逻辑（通用）
  const createDragHandler = React.useCallback(
    (callback: (x: number, y: number, w: number, h: number) => void) => {
      return (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const move = (moveEvent: MouseEvent) => {
          const rect = target.getBoundingClientRect();
          const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
          const y = Math.max(0, Math.min(moveEvent.clientY - rect.top, rect.height));
          callback(x, y, rect.width, rect.height);
        };
        move(e.nativeEvent);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', () => window.removeEventListener('mousemove', move), {
          once: true,
        });
      };
    },
    []
  );

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.advanced-color-picker')) {
        const finalColor = currentValueRef.current;
        const initialColor = initialValueRef.current;

        // 逻辑判断：
        // 1. 最终颜色和进入时的初始颜色不一样（说明用户改了）
        // 2. 最终颜色不是最近历史记录里的第一个（避免重复添加）
        if (finalColor && finalColor !== initialColor) {
          if (recentColors[0] !== finalColor) {
            addColor(finalColor);
          }
        }

        onClose?.();
      }
    };

    // 使用 capture: true 确保在其他点击事件前触发
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, addColor, recentColors]); // 移除 [value] 依赖，改用 Ref

  const currentRgb = hsbToRgb(hsb.h, hsb.s, hsb.v);
  const currentHex = rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b);

  return (
    <div className="advanced-color-picker w-[280px] bg-white rounded-lg shadow-2xl border border-slate-200 p-3 select-none">
      {/* 模式切换 */}
      <div className="flex p-0.5 bg-slate-100 rounded-md mb-3">
        {(['solid', 'gradient'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-1 text-xs rounded transition-all ${
              mode === m ? 'bg-white shadow-sm text-slate-900 font-medium' : 'text-slate-500'
            }`}
          >
            {m === 'solid' ? '单色' : '渐变色'}
          </button>
        ))}
      </div>

      {/* 渐变控制条：解决问题 3 */}
      {mode === 'gradient' && (
        <div
          className="mb-4 relative h-4 rounded-full border border-slate-200"
          style={{
            background: `linear-gradient(to right, ${stops.map(s => `${s.color} ${s.offset}%`).join(', ')})`,
          }}
        >
          {stops.map(stop => (
            <div
              key={stop.id}
              onClick={() => handleStopClick(stop)}
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 shadow-md ${
                activeStopId === stop.id ? 'border-blue-500 scale-125 z-10' : 'border-white'
              }`}
              style={{ left: `${stop.offset}%`, background: stop.color, marginLeft: '-8px' }}
            />
          ))}
        </div>
      )}

      {/* 饱和度面板：解决问题 2（层叠关系修正） */}
      <div
        ref={saturationRef}
        onMouseDown={createDragHandler((x, y, w, h) => {
          updateCurrentColor({ ...hsb, s: (x / w) * 100, v: 100 - (y / h) * 100 });
        })}
        className="relative w-full h-36 rounded-md mb-3 cursor-crosshair overflow-hidden"
        style={{ backgroundColor: pureHueColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div
          className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${hsb.s}%`, top: `${100 - hsb.v}%` }}
        />
      </div>

      {/* 滑块区域 */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1 space-y-3">
          {/* 色相条 */}
          <div
            ref={hueRef}
            onMouseDown={createDragHandler((x, _, w) =>
              updateCurrentColor({ ...hsb, h: (x / w) * 360 })
            )}
            className="relative h-3 rounded-full cursor-pointer"
            style={{
              background:
                'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
            }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-slate-300 rounded-full shadow-sm"
              style={{ left: `${(hsb.h / 360) * 100}%`, marginLeft: '-7px' }}
            />
          </div>

          {/* 透明度条 */}
          <div
            ref={alphaRef}
            onMouseDown={createDragHandler((x, _, w) =>
              updateCurrentColor(hsb, Math.round((x / w) * 100))
            )}
            className="relative h-3 rounded-full cursor-pointer"
            style={{
              background: `
                linear-gradient(to right, transparent, ${currentHex}),
                repeating-conic-gradient(#ddd 0% 25%, white 0% 50%) 50% / 8px 8px
              `,
            }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-slate-300 rounded-full shadow-sm"
              style={{ left: `${alpha}%`, marginLeft: '-7px' }}
            />
          </div>
        </div>

        {/* 颜色预览 */}
        <div
          className="w-10 h-10 rounded-lg border border-slate-200 shadow-inner overflow-hidden"
          style={{
            background: `
              repeating-conic-gradient(#ddd 0% 25%, white 0% 50%) 50% / 8px 8px
            `,
          }}
        >
          <div className="w-full h-full" style={{ background: getCurrentColorRgba() }} />
        </div>
      </div>

      {/* 底部输入框：解决问题 1 (Flex 布局优化) */}
      <div className="flex gap-1.5 items-center mb-3">
        <select className="w-14 text-[10px] border border-slate-200 rounded px-1 py-1 bg-slate-50 outline-none">
          <option>HEX</option>
          <option>RGB</option>
        </select>

        {/* 赋予 Hex 输入框 flex-1，给百分比固定宽度，防止挤出 */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={currentHex.replace('#', '')}
            onChange={e => {
              const val = e.target.value;
              if (val.length <= 6) {
                const rgb = hexToRgb('#' + val);
                if (rgb) setHsb(rgbToHsb(rgb.r, rgb.g, rgb.b));
              }
            }}
            className="w-full pl-3 pr-1 py-1 text-xs font-mono border border-slate-200 rounded outline-none focus:border-blue-400"
          />
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-slate-400 text-xs">#</span>
        </div>

        <div className="w-12 relative">
          <input
            type="text"
            value={alpha}
            onChange={e => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) setAlpha(Math.min(100, Math.max(0, v)));
            }}
            className="w-full pr-4 py-1 text-xs text-center border border-slate-200 rounded outline-none"
          />
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
            %
          </span>
        </div>
      </div>

      {/* 最近使用的颜色 */}
      {recentColors.length > 0 && (
        <div className="border-t border-slate-200 pt-3">
          <div className="text-xs text-slate-600 mb-2">最近使用</div>
          <div className="grid grid-cols-10 gap-1">
            {recentColors.map((color, index) => (
              <button
                key={`${color}-${index}`}
                onClick={() => handleColorApply(color)}
                className={`w-6 h-6 rounded border transition-all cursor-pointer overflow-hidden relative ${
                  value === color
                    ? 'border-blue-500 scale-110'
                    : 'border-slate-200 hover:border-slate-400 hover:scale-105'
                }`}
                title={color}
              >
                {/* 透明背景网格 */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'repeating-conic-gradient(#ddd 0% 25%, white 0% 50%) 50% / 4px 4px',
                  }}
                />
                {/* 颜色层 */}
                <div className="absolute inset-0" style={{ background: color }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
