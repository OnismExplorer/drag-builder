/**
 * PropertyPanel 组件
 * 属性编辑面板，固定在右侧，用于编辑选中组件的属性
 *
 * 需求：7.1, 7.2, 7.3, 7.4
 * - 7.1: 固定在画布右侧，宽度为 320px
 * - 7.2: 使用毛玻璃效果（backdrop-blur-lg）和半透明白色背景（bg-white/80）
 * - 7.3: 没有组件被选中时显示组件列表或提示文字
 * - 7.4: 组件被选中时显示编辑区域
 *
 * 改造：使用 ComponentRegistry 动态获取属性配置
 */

import React, { useMemo, useCallback } from 'react';
import { useComponentStore } from '../../store/componentStore';
import { componentRegistry } from '../../store/componentRegistry';
import type { ComponentNode } from '../../types';
import PositionEditor from './PositionEditor';
import LayerControl from './LayerControl';
import ComponentList from './ComponentList';
import StyleEditor from './StyleEditor';
import { DynamicPropertyEditor } from './DynamicPropertyEditor';
import { debounce } from '../../utils/timing';

/**
 * PropertyPanel 组件
 * 右侧固定面板，使用防抖优化性能
 * 使用 React.memo 避免不必要的重渲染（需求：14.2）
 */
const PropertyPanel: React.FC = React.memo(() => {
  const { components, getSelectedComponent, updateComponent } = useComponentStore();
  const component = getSelectedComponent();

  /**
   * 使用防抖优化输入性能（300ms）
   * 需求：14.4
   */
  const debouncedUpdate = useMemo(() => {
    const updateFn = (id: string, updates: Partial<ComponentNode>) => {
      updateComponent(id, updates);
    };
    return debounce(updateFn, 300);
  }, [updateComponent]);

  /**
   * 处理组件更新
   */
  const handleUpdate = useCallback(
    (updates: Partial<ComponentNode>) => {
      if (component) {
        debouncedUpdate(component.id, updates);
      }
    },
    [component, debouncedUpdate]
  );

  /**
   * 空状态：没有选中组件
   * 需求：7.3
   */
  if (!component) {
    return (
      <div
        className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[320px]
                      bg-white/80 backdrop-blur-lg border-l border-slate-200
                      overflow-y-auto"
      >
        <div className="p-6">
          {/* 标题 */}
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {components.length > 0 ? '组件列表' : '开始创建'}
          </h2>

          {/* 画布为空：显示提示 */}
          {components.length === 0 ? (
            <div className="space-y-4">
              <div
                className="flex flex-col items-center justify-center py-12 px-4
                              bg-slate-50 rounded-lg border-2 border-dashed border-slate-300"
              >
                <div className="text-4xl mb-3">📦</div>
                <p className="text-sm font-medium text-slate-900 mb-1">画布上还没有组件</p>
                <p className="text-xs text-slate-500 text-center">
                  从左侧物料库拖拽组件到画布开始创建
                </p>
              </div>

              {/* 快速提示 */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">💡</span>
                  <span>拖拽物料库中的组件到画布</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">💡</span>
                  <span>点击组件可以选中并编辑属性</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">💡</span>
                  <span>Ctrl + 点击可以多选组件</span>
                </div>
              </div>
            </div>
          ) : (
            /* 有组件但未选中：显示组件列表 */
            <div className="space-y-4">
              <p className="text-sm text-slate-600">点击下方组件可以选中并编辑属性</p>
              <ComponentList />
            </div>
          )}
        </div>
      </div>
    );
  }

  // 从 Registry 获取组件定义
  const definition = componentRegistry.get(component.type);

  /**
   * 有选中组件：显示编辑区域
   * 需求：7.4
   */
  return (
    <div
      className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[320px]
                    bg-white/80 backdrop-blur-lg border-l border-slate-200
                    overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* 位置与尺寸编辑器 - 通用 */}
        <PositionEditor component={component} onUpdate={handleUpdate} />

        {/* 样式编辑器 - 通用 */}
        <StyleEditor component={component} onUpdate={handleUpdate} />

        {/* 动态属性编辑器 - 从 Registry 获取 */}
        {definition && (
          <DynamicPropertyEditor
            groups={definition.propertyGroups}
            component={component}
            onUpdate={handleUpdate}
          />
        )}

        {/* 如果没有 Registry 定义但有动画，显示动画编辑器 */}
        {!definition && component.animation && (
          <DynamicPropertyEditor
            groups={[
              {
                id: 'animation',
                label: '动画配置',
                properties: [],
              },
            ]}
            component={component}
            onUpdate={handleUpdate}
          />
        )}

        {/* 层级控制 - 通用 */}
        <LayerControl componentId={component.id} />
      </div>
    </div>
  );
});

export default PropertyPanel;
