/**
 * LayerControl 组件
 * 层级控制组件
 *
 * 需求：8.1, 8.2, 8.3, 8.4, 8.5
 * - 8.1: 提供四个层级控制按钮
 * - 8.2: 置于顶层（zIndex = 最大值 + 1）
 * - 8.3: 上移一层（zIndex + 1）
 * - 8.4: 下移一层（zIndex - 1）
 * - 8.5: 置于底层（zIndex = 0）
 *
 * 增强功能：
 * - 显示当前组件的层级
 * - 根据层级状态智能禁用按钮
 * - 限制层级范围（0-999）
 */

import React, { useMemo } from 'react';
import { useComponentStore } from '@store/componentStore';

interface LayerControlProps {
  componentId: string;
}

// 层级范围限制
const MIN_Z_INDEX = 0;
const MAX_Z_INDEX = 999;

/**
 * 图标按钮组件
 */
interface IconButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, label, onClick, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 flex flex-col items-center justify-center gap-1 
               rounded-lg p-2 transition-colors
               ${
                 disabled
                   ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                   : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
               }`}
    title={
      disabled
        ? `${label}（已${label === '置于顶层' || label === '上移一层' ? '达到最高层' : '达到最低层'}）`
        : label
    }
  >
    <span className="text-lg">{icon}</span>
    <span className="text-xs">{label}</span>
  </button>
);

/**
 * LayerControl 组件
 * 四个按钮：置于顶层、上移一层、下移一层、置于底层
 */
const LayerControl: React.FC<LayerControlProps> = ({ componentId }) => {
  const { components, getComponentById, bringToFront, sendToBack, moveUp, moveDown } =
    useComponentStore();

  // 获取当前组件
  const currentComponent = getComponentById(componentId);

  /**
   * 计算层级信息
   */
  const layerInfo = useMemo(() => {
    if (!currentComponent) {
      return {
        currentZIndex: 0,
        minZIndex: 0,
        maxZIndex: 0,
        isAtTop: false,
        isAtBottom: false,
      };
    }

    const currentZIndex = currentComponent.position.zIndex;

    // 计算所有组件的最小和最大 zIndex
    const allZIndexes = components.map(c => c.position.zIndex);
    const minZIndex = Math.min(...allZIndexes, MIN_Z_INDEX);
    const maxZIndex = Math.max(...allZIndexes, MIN_Z_INDEX);

    // 判断是否在顶层或底层
    const isAtTop = currentZIndex >= maxZIndex;
    const isAtBottom = currentZIndex <= minZIndex;

    return {
      currentZIndex,
      minZIndex,
      maxZIndex,
      isAtTop,
      isAtBottom,
    };
  }, [currentComponent, components]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">层级控制</h3>
        {/* 显示当前层级 */}
        <div className="text-xs text-slate-500">
          <span className="font-medium text-slate-700">{layerInfo.currentZIndex}</span>
          <span className="mx-1">/</span>
          <span>
            {layerInfo.minZIndex}-{Math.min(layerInfo.maxZIndex, MAX_Z_INDEX)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* 置于顶层 - 需求：8.2 */}
        <IconButton
          icon="↑↑"
          label="置于顶层"
          onClick={() => bringToFront(componentId)}
          disabled={layerInfo.isAtTop}
        />

        {/* 上移一层 - 需求：8.3 */}
        <IconButton
          icon="↑"
          label="上移一层"
          onClick={() => moveUp(componentId)}
          disabled={layerInfo.isAtTop}
        />

        {/* 下移一层 - 需求：8.4 */}
        <IconButton
          icon="↓"
          label="下移一层"
          onClick={() => moveDown(componentId)}
          disabled={layerInfo.isAtBottom}
        />

        {/* 置于底层 - 需求：8.5 */}
        <IconButton
          icon="↓↓"
          label="置于底层"
          onClick={() => sendToBack(componentId)}
          disabled={layerInfo.isAtBottom}
        />
      </div>
    </div>
  );
};

export default LayerControl;
