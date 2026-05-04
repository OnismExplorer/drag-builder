import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnimationConfig } from '@/types';

/**
 * 动画预览 Hook
 * 处理动画预览的"播放→复原"逻辑
 *
 * 行为：
 * - 用户每次点击预设动画，都应该播放一次预览
 * - 动画播放完毕后，组件回归自然状态（通过 key 变化重新挂载实现）
 * - animation 配置保留在 store 中，不影响属性面板和导出
 *
 * @param animation 动画配置
 * @returns { isPreviewing, stopPreview }
 */
export function useAnimationPreview(animation: AnimationConfig | undefined): {
  isPreviewing: boolean;
  stopPreview: () => void;
} {
  // 用于标记是否正在预览中
  const [isPreviewing, setIsPreviewing] = useState(false);

  // 记录上一次的 animation 字符串值，用于检测变化
  const prevAnimationStrRef = useRef<string | undefined>(undefined);

  // 记录当前是否处于复原流程中（避免复原后再次触发）
  const isRestoringRef = useRef(false);

  // 停止预览
  // 动画播放完毕后调用，让组件回归自然状态
  const stopPreview = useCallback(() => {
    isRestoringRef.current = true;
    setIsPreviewing(false);
    isRestoringRef.current = false;
  }, []);

  // 动画配置变化时，检测是否需要播放预览
  useEffect(() => {
    // 如果正在复原中，跳过检测
    if (isRestoringRef.current) return;

    const currAnimationStr = animation ? JSON.stringify(animation) : undefined;
    const prevAnimationStr = prevAnimationStrRef.current;

    // 检测 animation 配置是否真正变化了
    if (currAnimationStr && currAnimationStr !== prevAnimationStr) {
      // 有新的动画配置，需要播放预览
      // 使用 setTimeout 避免在 effect 内部同步调用 setState
      setTimeout(() => {
        if (!isRestoringRef.current) {
          setIsPreviewing(true);
        }
      }, 0);
    }

    // 更新引用
    prevAnimationStrRef.current = currAnimationStr;
  }, [animation]);

  return { isPreviewing, stopPreview };
}
