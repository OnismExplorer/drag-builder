/**
 * 防抖和节流工具函数
 *
 * 需求：14.4
 * - 属性输入框：防抖 300ms
 * - 画布拖拽：节流 16ms（约 60fps）
 * - 窗口 resize：防抖 200ms
 */

/**
 * 防抖函数
 * 在最后一次调用后等待指定时间再执行
 *
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * 节流函数
 * 在指定时间内最多执行一次
 *
 * @param func 要节流的函数
 * @param interval 节流间隔（毫秒）
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastTime);

    if (remaining <= 0) {
      // 已超过节流间隔，立即执行
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func(...args);
    } else if (!timeoutId) {
      // 在剩余时间后执行（确保最后一次调用也能执行）
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func(...args);
      }, remaining);
    }
  };
}
