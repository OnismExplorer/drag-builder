/**
 * 颜色历史记录 Store
 * 记录用户最近使用的 10 种颜色
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ColorHistoryState {
  recentColors: string[];
  addColor: (color: string) => void;
  clearHistory: () => void;
}

/**
 * 颜色历史记录 Store
 * 使用 localStorage 持久化
 */
export const useColorHistoryStore = create<ColorHistoryState>()(
  persist(
    set => ({
      recentColors: [],

      /**
       * 添加颜色到历史记录
       * - 如果颜色已存在，移到最前面
       * - 如果是新颜色，添加到最前面
       * - 最多保留 10 种颜色
       */
      addColor: (color: string) => {
        set(state => {
          // 标准化颜色格式
          // HEX 转大写，rgba 保持原样
          const normalizedColor = color.startsWith('#') ? color.toUpperCase() : color;

          // 过滤掉已存在的颜色（忽略大小写比较）
          const filtered = state.recentColors.filter(
            c => c.toLowerCase() !== normalizedColor.toLowerCase()
          );

          // 添加到最前面，最多保留 10 个
          const updated = [normalizedColor, ...filtered].slice(0, 10);

          return { recentColors: updated };
        });
      },

      /**
       * 清空历史记录
       */
      clearHistory: () => {
        set({ recentColors: [] });
      },
    }),
    {
      name: 'color-history-storage',
    }
  )
);
