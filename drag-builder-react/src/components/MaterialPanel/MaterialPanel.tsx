/**
 * MaterialPanel 组件
 * 物料库面板，展示可拖拽的组件列表
 *
 * 功能：
 * - 支持分类（基础组件、表单组件）
 * - 分类可折叠/展开
 * - 网格布局（grid-cols-3）
 * - 毛玻璃效果
 * - 浮层预览
 *
 * 改造：使用 ComponentRegistry 动态获取组件列表
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { MaterialItem } from './MaterialItem';
import { FloatingPreview } from './FloatingPreview';
import { componentRegistry } from '@store/componentRegistry';
import type { MaterialConfig } from '@store/componentRegistry';

/**
 * MaterialPanel 组件
 * 左侧固定面板，使用毛玻璃效果
 */
export const MaterialPanel: React.FC = () => {
  // 管理每个分类的折叠状态（默认全部展开）
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // 管理浮层预览状态
  const [hoveredConfig, setHoveredConfig] = useState<MaterialConfig | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  // 从 Registry 动态获取分类和组件
  const categories = componentRegistry.getCategories();
  const materialsByCategory = componentRegistry.getMaterialsByCategory();

  /**
   * 处理组件悬浮状态变化
   */
  const handleHoverChange = (config: MaterialConfig | null, element?: HTMLElement | null) => {
    setHoveredConfig(config);
    setTriggerElement(element || null);
  };

  /**
   * 切换分类的折叠状态
   */
  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // 构建分类 Map 便于查找
  const categoryMap = new Map(categories.map(c => [c.id, c]));

  return (
    <>
      <div
        className="
          fixed left-0 top-16 h-[calc(100vh-4rem)] w-[280px]
          bg-white/80 backdrop-blur-lg
          border-r border-slate-200
          overflow-y-auto
          select-none
        "
      >
        <div className="p-6">
          {/* 标题 */}
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">组件库</h2>

          {/* 分类列表 */}
          <div className="space-y-4">
            {materialsByCategory.map(({ category: categoryId, items }) => {
              const categoryInfo = categoryMap.get(categoryId);
              const categoryName = categoryInfo?.name || categoryId;
              const isCollapsed = collapsedCategories.has(categoryId);

              return (
                <div key={categoryId} className="space-y-2">
                  {/* 分类标题 - 可点击折叠 */}
                  <button
                    onClick={() => toggleCategory(categoryId)}
                    className="
                      flex items-center justify-between w-full
                      text-sm font-medium text-slate-700
                      hover:text-slate-900
                      transition-colors
                      group
                    "
                  >
                    <span>{categoryName}</span>
                    <motion.div
                      animate={{ rotate: isCollapsed ? 0 : 90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </motion.div>
                  </button>

                  {/* 组件网格 - 带折叠动画 */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.3,
                          ease: 'easeInOut',
                        }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          {items.map(config => (
                            <MaterialItem
                              key={config.type}
                              config={config}
                              onHoverChange={handleHoverChange}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 leading-relaxed">💡 拖拽组件到画布开始设计</p>
          </div>
        </div>
      </div>

      {/* 浮层预览 */}
      <FloatingPreview
        config={hoveredConfig}
        isVisible={hoveredConfig !== null}
        triggerElement={triggerElement}
      />
    </>
  );
};
