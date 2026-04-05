/**
 * 性能优化测试
 *
 * 测试虚拟化渲染、防抖和节流功能
 *
 * 验证需求：14.1, 14.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  filterVisibleComponents,
  calculateViewport,
  VIRTUALIZATION_THRESHOLD,
  isComponentVisible,
} from '../src/utils/virtualCanvas';
import { debounce, throttle } from '../src/utils/timing';
import type { ComponentNode } from '../src/types';

// ─────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────

/**
 * 创建测试用组件节点
 */
function makeComponent(
  id: string,
  x: number,
  y: number,
  width = 100,
  height = 100
): ComponentNode {
  return {
    id,
    type: 'div',
    position: { x, y, width, height, zIndex: 0 },
    styles: {},
    content: {},
  };
}

/**
 * 批量创建指定数量的组件（均匀分布在画布上）
 */
function makeComponents(count: number): ComponentNode[] {
  return Array.from({ length: count }, (_, i) =>
    makeComponent(`comp-${i}`, (i % 20) * 120, Math.floor(i / 20) * 120)
  );
}

// ─────────────────────────────────────────────
// 需求 14.1：虚拟化渲染测试
// ─────────────────────────────────────────────

/**
 * Validates: Requirements 14.1
 */
describe('需求 14.1：虚拟化渲染', () => {
  /** 标准可视区域（覆盖画布左上角区域） */
  const viewport = { left: 0, top: 0, right: 800, bottom: 600 };

  it('VIRTUALIZATION_THRESHOLD 应为 50', () => {
    expect(VIRTUALIZATION_THRESHOLD).toBe(50);
  });

  it('组件数量 ≤ 50 时，返回全部组件（不启用虚拟化）', () => {
    // 恰好 50 个组件，均在可视区域内
    const components = makeComponents(50);
    const result = filterVisibleComponents(components, viewport, []);
    // 未超过阈值，应返回全部
    expect(result).toHaveLength(50);
    expect(result).toEqual(components);
  });

  it('组件数量为 0 时，返回空数组', () => {
    const result = filterVisibleComponents([], viewport, []);
    expect(result).toHaveLength(0);
  });

  it('组件数量 > 50 时，启用虚拟化，仅返回可视区域内的组件', () => {
    // 51 个组件：前 50 个在可视区域内（x: 0-2400, y: 0-240），第 51 个在视口外
    const components = makeComponents(50);
    // 添加第 51 个组件，放在视口外
    components.push(makeComponent('comp-50', 5000, 5000));

    const result = filterVisibleComponents(components, viewport, []);

    // 启用虚拟化后，视口外的组件不应被渲染
    expect(result.length).toBeLessThan(components.length);
    // 视口外的组件不应出现在结果中
    expect(result.find((c) => c.id === 'comp-50')).toBeUndefined();
  });

  it('组件数量 > 50 时，选中的组件始终被渲染（即使在视口外）', () => {
    const components = makeComponents(50);
    // 第 51 个组件在视口外，但被选中
    const outOfViewComp = makeComponent('selected-out', 9000, 9000);
    components.push(outOfViewComp);

    const result = filterVisibleComponents(components, viewport, ['selected-out']);

    // 选中的组件即使在视口外也应被渲染
    expect(result.find((c) => c.id === 'selected-out')).toBeDefined();
  });

  it('组件数量 > 50 时，视口内的组件全部被渲染', () => {
    // 创建 60 个组件：前 10 个在视口内，其余在视口外
    const inViewComponents = Array.from({ length: 10 }, (_, i) =>
      makeComponent(`in-view-${i}`, i * 50, 0)
    );
    const outViewComponents = Array.from({ length: 50 }, (_, i) =>
      makeComponent(`out-view-${i}`, 5000 + i * 50, 5000)
    );
    const components = [...inViewComponents, ...outViewComponents];

    const result = filterVisibleComponents(components, viewport, []);

    // 视口内的 10 个组件应全部出现
    inViewComponents.forEach((comp) => {
      expect(result.find((c) => c.id === comp.id)).toBeDefined();
    });
  });

  it('isComponentVisible：组件与视口有交集时返回 true', () => {
    // 组件部分在视口内（右边界超出视口左边界）
    const comp = makeComponent('c1', -50, 0, 100, 100); // x: -50 ~ 50
    expect(isComponentVisible(comp, viewport)).toBe(true);
  });

  it('isComponentVisible：组件完全在视口外时返回 false', () => {
    const comp = makeComponent('c2', 5000, 5000);
    expect(isComponentVisible(comp, viewport)).toBe(false);
  });

  it('calculateViewport：zoom=1, pan=(0,0) 时可视区域计算正确', () => {
    // 容器 800x600，画布 1200x800，zoom=1，pan=(0,0)
    const vp = calculateViewport(800, 600, 1200, 800, 1, { x: 0, y: 0 });

    // 画布左上角在容器中的位置：
    //   canvasLeft = 800/2 + 0 - 1200*1/2 = 400 - 600 = -200
    //   canvasTop  = 600/2 + 0 - 800*1/2  = 300 - 400 = -100
    // 可视区域（含 200px 缓冲）：
    //   viewLeft = -(-200)/1 - 200 = 200 - 200 = 0
    //   viewTop  = -(-100)/1 - 200 = 100 - 200 = -100
    expect(vp.left).toBeCloseTo(0);
    expect(vp.top).toBeCloseTo(-100);
    expect(vp.right).toBeCloseTo((800 - (-200)) / 1 + 200); // 1200
    expect(vp.bottom).toBeCloseTo((600 - (-100)) / 1 + 200); // 900
  });
});

// ─────────────────────────────────────────────
// 需求 14.4：防抖测试
// ─────────────────────────────────────────────

/**
 * Validates: Requirements 14.4
 */
describe('需求 14.4：防抖（debounce）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('在延迟时间内多次调用，只执行最后一次', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    // 快速连续调用 5 次
    debouncedFn('call-1');
    debouncedFn('call-2');
    debouncedFn('call-3');
    debouncedFn('call-4');
    debouncedFn('call-5');

    // 延迟未到，函数不应被调用
    expect(fn).not.toHaveBeenCalled();

    // 推进 300ms
    vi.advanceTimersByTime(300);

    // 只执行了一次，且是最后一次的参数
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('call-5');
  });

  it('延迟 300ms 后才执行（属性输入框场景）', () => {
    const onUpdate = vi.fn();
    const debouncedUpdate = debounce(onUpdate, 300);

    debouncedUpdate({ x: 100 });

    // 299ms 时不应执行
    vi.advanceTimersByTime(299);
    expect(onUpdate).not.toHaveBeenCalled();

    // 再推进 1ms（共 300ms）
    vi.advanceTimersByTime(1);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledWith({ x: 100 });
  });

  it('每次新调用都会重置计时器', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('first');
    vi.advanceTimersByTime(200); // 200ms 后再次调用，重置计时器

    debouncedFn('second');
    vi.advanceTimersByTime(200); // 再过 200ms，总共 400ms，但计时器被重置

    // 计时器被重置，还未到 300ms，不应执行
    expect(fn).not.toHaveBeenCalled();

    // 再推进 100ms（从第二次调用算起共 300ms）
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');
  });

  it('两次调用间隔超过延迟时，各自独立执行', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('first');
    vi.advanceTimersByTime(300); // 第一次执行
    expect(fn).toHaveBeenCalledTimes(1);

    debouncedFn('second');
    vi.advanceTimersByTime(300); // 第二次执行
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(2, 'second');
  });

  it('支持传递多个参数', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 300);

    debouncedFn('a', 'b', 'c');
    vi.advanceTimersByTime(300);

    expect(fn).toHaveBeenCalledWith('a', 'b', 'c');
  });
});

// ─────────────────────────────────────────────
// 需求 14.4：节流测试
// ─────────────────────────────────────────────

/**
 * Validates: Requirements 14.4
 */
describe('需求 14.4：节流（throttle）', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('在节流间隔内多次调用，只执行第一次', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 16);

    // 第一次调用立即执行
    throttledFn('call-1');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('call-1');

    // 间隔内的调用不执行
    throttledFn('call-2');
    throttledFn('call-3');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('16ms 节流间隔（画布拖拽场景）', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 16);

    throttledFn('drag-1'); // 立即执行
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(10); // 10ms 内再次调用，不执行
    throttledFn('drag-2');
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(6); // 共 16ms，节流间隔到期
    // 节流实现会在剩余时间后执行最后一次调用
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('超过节流间隔后，下一次调用立即执行', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 16);

    throttledFn('first');
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(16); // 等待节流间隔
    throttledFn('second');
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  it('节流函数确保最后一次调用也会被执行', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 16);

    throttledFn('first'); // 立即执行
    vi.advanceTimersByTime(5);
    throttledFn('last'); // 在间隔内，会被延迟执行

    // 等待剩余时间
    vi.advanceTimersByTime(11);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('last');
  });

  it('支持传递多个参数', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 16);

    throttledFn(100, 200);
    expect(fn).toHaveBeenCalledWith(100, 200);
  });
});
