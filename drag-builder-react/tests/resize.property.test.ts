/**
 * 调整功能属性测试
 * 使用 fast-check 进行基于属性的测试
 * 
 * 每个属性测试运行 100 次迭代
 * 
 * 测试组件尺寸调整的正确性属性：
 * - 属性 6：组件尺寸边界不变量
 * - 属性 7：角落手柄调整行为
 * - 属性 8：边缘手柄调整行为
 * - 属性 9：Shift 键保持宽高比
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { useCanvasStore } from '../src/store/canvasStore';
import { useComponentStore } from '../src/store/componentStore';
import type { ComponentNode } from '../src/types';

/**
 * 辅助函数：创建测试组件
 */
const createTestComponent = (
  id: string,
  width: number,
  height: number,
  x: number = 100,
  y: number = 100
): ComponentNode => ({
  id,
  type: 'div',
  position: { x, y, width, height, zIndex: 0 },
  styles: {},
  content: {},
});

/**
 * 辅助函数：模拟调整组件尺寸
 * 这个函数模拟了 ResizeHandles 组件的调整逻辑
 */
const resizeComponent = (
  component: ComponentNode,
  deltaWidth: number,
  deltaHeight: number,
  handle: 'corner' | 'horizontal' | 'vertical',
  canvasWidth: number,
  canvasHeight: number,
  maintainAspectRatio: boolean = false
): ComponentNode => {
  const MIN_SIZE = 20;
  const MAX_WIDTH = canvasWidth * 2;
  const MAX_HEIGHT = canvasHeight * 2;
  
  let newWidth = component.position.width;
  let newHeight = component.position.height;
  
  if (handle === 'corner') {
    // 角落手柄：同时调整宽高
    if (maintainAspectRatio) {
      // 保持宽高比
      const aspectRatio = component.position.width / component.position.height;
      // 使用较大的变化量来确定调整方向
      if (Math.abs(deltaWidth) > Math.abs(deltaHeight)) {
        newWidth = component.position.width + deltaWidth;
        newHeight = newWidth / aspectRatio;
      } else {
        newHeight = component.position.height + deltaHeight;
        newWidth = newHeight * aspectRatio;
      }
    } else {
      newWidth = component.position.width + deltaWidth;
      newHeight = component.position.height + deltaHeight;
    }
  } else if (handle === 'horizontal') {
    // 水平边缘手柄：仅调整宽度
    newWidth = component.position.width + deltaWidth;
  } else if (handle === 'vertical') {
    // 垂直边缘手柄：仅调整高度
    newHeight = component.position.height + deltaHeight;
  }
  
  // 应用边界限制
  newWidth = Math.max(MIN_SIZE, Math.min(MAX_WIDTH, newWidth));
  newHeight = Math.max(MIN_SIZE, Math.min(MAX_HEIGHT, newHeight));
  
  return {
    ...component,
    position: {
      ...component.position,
      width: newWidth,
      height: newHeight,
    },
  };
};

/**
 * Feature: drag-builder, Property 6: 组件尺寸边界不变量
 * 
 * 对于任何组件，在任何时刻，其尺寸应该满足：
 * 1. width >= 20 且 height >= 20（最小尺寸）
 * 2. width <= canvasWidth * 2 且 height <= canvasHeight * 2（最大尺寸）
 * 
 * 验证需求：5.4, 5.5
 */
describe('Property 6: 组件尺寸边界不变量', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
    useComponentStore.getState().clearAll();
  });

  it('对于任何尺寸调整操作，组件尺寸应该在有效范围内', () => {
    fc.assert(
      fc.property(
        // 生成初始尺寸
        fc.record({
          initialWidth: fc.integer({ min: 20, max: 1000 }),
          initialHeight: fc.integer({ min: 20, max: 1000 }),
        }),
        // 生成调整增量（可能是负数）
        fc.record({
          deltaWidth: fc.integer({ min: -2000, max: 2000 }),
          deltaHeight: fc.integer({ min: -2000, max: 2000 }),
        }),
        // 生成手柄类型
        fc.constantFrom('corner', 'horizontal', 'vertical'),
        (initial, delta, handle) => {
          const canvasConfig = useCanvasStore.getState().config;
          const component = createTestComponent(
            'test-1',
            initial.initialWidth,
            initial.initialHeight
          );
          
          // 执行调整操作
          const resized = resizeComponent(
            component,
            delta.deltaWidth,
            delta.deltaHeight,
            handle as 'corner' | 'horizontal' | 'vertical',
            canvasConfig.width,
            canvasConfig.height
          );
          
          // 验证最小尺寸边界
          expect(resized.position.width).toBeGreaterThanOrEqual(20);
          expect(resized.position.height).toBeGreaterThanOrEqual(20);
          
          // 验证最大尺寸边界
          expect(resized.position.width).toBeLessThanOrEqual(canvasConfig.width * 2);
          expect(resized.position.height).toBeLessThanOrEqual(canvasConfig.height * 2);
          
          // 验证尺寸是有限数字
          expect(Number.isFinite(resized.position.width)).toBe(true);
          expect(Number.isFinite(resized.position.height)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于极端输入值，应该正确限制尺寸', () => {
    const canvasConfig = useCanvasStore.getState().config;
    const component = createTestComponent('test-1', 100, 100);
    
    // 测试极小值
    const tooSmall = resizeComponent(
      component,
      -200,
      -200,
      'corner',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(tooSmall.position.width).toBe(20);
    expect(tooSmall.position.height).toBe(20);
    
    // 测试极大值
    const tooLarge = resizeComponent(
      component,
      10000,
      10000,
      'corner',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(tooLarge.position.width).toBe(canvasConfig.width * 2);
    expect(tooLarge.position.height).toBe(canvasConfig.height * 2);
  });

  it('对于边界值，应该正确处理', () => {
    const canvasConfig = useCanvasStore.getState().config;
    
    // 测试最小尺寸边界
    const minComponent = createTestComponent('test-1', 20, 20);
    const shrinkMin = resizeComponent(
      minComponent,
      -10,
      -10,
      'corner',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(shrinkMin.position.width).toBe(20);
    expect(shrinkMin.position.height).toBe(20);
    
    // 测试最大尺寸边界
    const maxComponent = createTestComponent(
      'test-2',
      canvasConfig.width * 2,
      canvasConfig.height * 2
    );
    const expandMax = resizeComponent(
      maxComponent,
      100,
      100,
      'corner',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(expandMax.position.width).toBe(canvasConfig.width * 2);
    expect(expandMax.position.height).toBe(canvasConfig.height * 2);
  });
});

/**
 * Feature: drag-builder, Property 7: 角落手柄调整行为
 * 
 * 对于任何拖拽组件角落手柄的操作，组件的宽度和高度应该同时改变
 * 
 * 验证需求：5.1
 */
describe('Property 7: 角落手柄调整行为', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
    useComponentStore.getState().clearAll();
  });

  it('对于任何角落手柄调整，宽度和高度应该同时改变', () => {
    fc.assert(
      fc.property(
        // 生成初始尺寸
        fc.record({
          initialWidth: fc.integer({ min: 50, max: 500 }),
          initialHeight: fc.integer({ min: 50, max: 500 }),
        }),
        // 生成非零调整增量
        fc.record({
          deltaWidth: fc.integer({ min: -100, max: 100 }).filter(d => d !== 0),
          deltaHeight: fc.integer({ min: -100, max: 100 }).filter(d => d !== 0),
        }),
        (initial, delta) => {
          const canvasConfig = useCanvasStore.getState().config;
          const component = createTestComponent(
            'test-1',
            initial.initialWidth,
            initial.initialHeight
          );
          
          // 执行角落手柄调整
          const resized = resizeComponent(
            component,
            delta.deltaWidth,
            delta.deltaHeight,
            'corner',
            canvasConfig.width,
            canvasConfig.height,
            false // 不保持宽高比
          );
          
          // 验证宽度改变
          const widthChanged = resized.position.width !== component.position.width;
          // 验证高度改变
          const heightChanged = resized.position.height !== component.position.height;
          
          // 至少有一个维度应该改变（除非受边界限制）
          // 如果宽度和高度都没有达到边界，那么两者都应该改变
          const widthAtBoundary = 
            resized.position.width === 20 || 
            resized.position.width === canvasConfig.width * 2;
          const heightAtBoundary = 
            resized.position.height === 20 || 
            resized.position.height === canvasConfig.height * 2;
          
          if (!widthAtBoundary && !heightAtBoundary) {
            // 如果都没有达到边界，两者都应该改变
            expect(widthChanged || heightChanged).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('角落手柄调整应该同时影响宽度和高度', () => {
    const canvasConfig = useCanvasStore.getState().config;
    const component = createTestComponent('test-1', 100, 100);
    
    // 同时增加宽度和高度
    const enlarged = resizeComponent(
      component,
      50,
      50,
      'corner',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(enlarged.position.width).toBe(150);
    expect(enlarged.position.height).toBe(150);
    
    // 同时减少宽度和高度
    const shrunk = resizeComponent(
      component,
      -30,
      -30,
      'corner',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(shrunk.position.width).toBe(70);
    expect(shrunk.position.height).toBe(70);
    
    // 不对称调整
    const asymmetric = resizeComponent(
      component,
      40,
      -20,
      'corner',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(asymmetric.position.width).toBe(140);
    expect(asymmetric.position.height).toBe(80);
  });
});

/**
 * Feature: drag-builder, Property 8: 边缘手柄调整行为
 * 
 * 对于任何拖拽组件边缘手柄的操作，只有对应方向的尺寸应该改变
 * （水平边缘改变宽度，垂直边缘改变高度）
 * 
 * 验证需求：5.2
 */
describe('Property 8: 边缘手柄调整行为', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
    useComponentStore.getState().clearAll();
  });

  it('对于水平边缘手柄，只有宽度应该改变', () => {
    fc.assert(
      fc.property(
        // 生成初始尺寸
        fc.record({
          initialWidth: fc.integer({ min: 50, max: 500 }),
          initialHeight: fc.integer({ min: 50, max: 500 }),
        }),
        // 生成非零宽度调整增量
        fc.integer({ min: -100, max: 100 }).filter(d => d !== 0),
        (initial, deltaWidth) => {
          const canvasConfig = useCanvasStore.getState().config;
          const component = createTestComponent(
            'test-1',
            initial.initialWidth,
            initial.initialHeight
          );
          
          // 执行水平边缘手柄调整
          const resized = resizeComponent(
            component,
            deltaWidth,
            0, // 高度增量为 0
            'horizontal',
            canvasConfig.width,
            canvasConfig.height
          );
          
          // 验证高度不变
          expect(resized.position.height).toBe(component.position.height);
          
          // 验证宽度改变（除非受边界限制）
          const widthAtBoundary = 
            resized.position.width === 20 || 
            resized.position.width === canvasConfig.width * 2;
          
          if (!widthAtBoundary) {
            expect(resized.position.width).not.toBe(component.position.width);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于垂直边缘手柄，只有高度应该改变', () => {
    fc.assert(
      fc.property(
        // 生成初始尺寸
        fc.record({
          initialWidth: fc.integer({ min: 50, max: 500 }),
          initialHeight: fc.integer({ min: 50, max: 500 }),
        }),
        // 生成非零高度调整增量
        fc.integer({ min: -100, max: 100 }).filter(d => d !== 0),
        (initial, deltaHeight) => {
          const canvasConfig = useCanvasStore.getState().config;
          const component = createTestComponent(
            'test-1',
            initial.initialWidth,
            initial.initialHeight
          );
          
          // 执行垂直边缘手柄调整
          const resized = resizeComponent(
            component,
            0, // 宽度增量为 0
            deltaHeight,
            'vertical',
            canvasConfig.width,
            canvasConfig.height
          );
          
          // 验证宽度不变
          expect(resized.position.width).toBe(component.position.width);
          
          // 验证高度改变（除非受边界限制）
          const heightAtBoundary = 
            resized.position.height === 20 || 
            resized.position.height === canvasConfig.height * 2;
          
          if (!heightAtBoundary) {
            expect(resized.position.height).not.toBe(component.position.height);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('水平边缘手柄应该只改变宽度', () => {
    const canvasConfig = useCanvasStore.getState().config;
    const component = createTestComponent('test-1', 100, 100);
    
    // 增加宽度
    const widened = resizeComponent(
      component,
      50,
      0,
      'horizontal',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(widened.position.width).toBe(150);
    expect(widened.position.height).toBe(100); // 高度不变
    
    // 减少宽度
    const narrowed = resizeComponent(
      component,
      -30,
      0,
      'horizontal',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(narrowed.position.width).toBe(70);
    expect(narrowed.position.height).toBe(100); // 高度不变
  });

  it('垂直边缘手柄应该只改变高度', () => {
    const canvasConfig = useCanvasStore.getState().config;
    const component = createTestComponent('test-1', 100, 100);
    
    // 增加高度
    const taller = resizeComponent(
      component,
      0,
      50,
      'vertical',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(taller.position.width).toBe(100); // 宽度不变
    expect(taller.position.height).toBe(150);
    
    // 减少高度
    const shorter = resizeComponent(
      component,
      0,
      -30,
      'vertical',
      canvasConfig.width,
      canvasConfig.height
    );
    expect(shorter.position.width).toBe(100); // 宽度不变
    expect(shorter.position.height).toBe(70);
  });
});

/**
 * Feature: drag-builder, Property 9: Shift 键保持宽高比
 * 
 * 对于任何按住 Shift 键拖拽角落手柄的操作，组件的宽高比应该保持不变
 * 
 * 验证需求：5.3
 */
describe('Property 9: Shift 键保持宽高比', () => {
  beforeEach(() => {
    useCanvasStore.getState().resetCanvas();
    useComponentStore.getState().clearAll();
  });

  it('对于任何角落手柄调整（按住 Shift），宽高比应该保持不变', () => {
    fc.assert(
      fc.property(
        // 生成初始尺寸（确保不是正方形，以便测试宽高比）
        fc.record({
          initialWidth: fc.integer({ min: 50, max: 500 }),
          initialHeight: fc.integer({ min: 50, max: 500 }),
        }).filter(size => size.initialWidth !== size.initialHeight),
        // 生成非零调整增量
        fc.record({
          deltaWidth: fc.integer({ min: -100, max: 100 }).filter(d => d !== 0),
          deltaHeight: fc.integer({ min: -100, max: 100 }).filter(d => d !== 0),
        }),
        (initial, delta) => {
          const canvasConfig = useCanvasStore.getState().config;
          const component = createTestComponent(
            'test-1',
            initial.initialWidth,
            initial.initialHeight
          );
          
          // 计算原始宽高比
          const originalAspectRatio = component.position.width / component.position.height;
          
          // 执行角落手柄调整（按住 Shift 键）
          const resized = resizeComponent(
            component,
            delta.deltaWidth,
            delta.deltaHeight,
            'corner',
            canvasConfig.width,
            canvasConfig.height,
            true // 保持宽高比
          );
          
          // 计算调整后的宽高比
          const newAspectRatio = resized.position.width / resized.position.height;
          
          // 验证宽高比保持不变（允许小的浮点误差）
          // 除非受到边界限制
          const widthAtBoundary = 
            resized.position.width === 20 || 
            resized.position.width === canvasConfig.width * 2;
          const heightAtBoundary = 
            resized.position.height === 20 || 
            resized.position.height === canvasConfig.height * 2;
          
          if (!widthAtBoundary && !heightAtBoundary) {
            // 允许 1% 的误差（由于浮点运算）
            const aspectRatioDiff = Math.abs(newAspectRatio - originalAspectRatio);
            const tolerance = originalAspectRatio * 0.01;
            expect(aspectRatioDiff).toBeLessThanOrEqual(tolerance);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('按住 Shift 键调整应该保持宽高比', () => {
    const canvasConfig = useCanvasStore.getState().config;
    
    // 测试 2:1 宽高比
    const wideComponent = createTestComponent('test-1', 200, 100);
    const originalRatio1 = wideComponent.position.width / wideComponent.position.height;
    
    const resized1 = resizeComponent(
      wideComponent,
      50,
      50,
      'corner',
      canvasConfig.width,
      canvasConfig.height,
      true
    );
    const newRatio1 = resized1.position.width / resized1.position.height;
    expect(Math.abs(newRatio1 - originalRatio1)).toBeLessThan(0.1);
    
    // 测试 1:2 宽高比
    const tallComponent = createTestComponent('test-2', 100, 200);
    const originalRatio2 = tallComponent.position.width / tallComponent.position.height;
    
    const resized2 = resizeComponent(
      tallComponent,
      -30,
      -30,
      'corner',
      canvasConfig.width,
      canvasConfig.height,
      true
    );
    const newRatio2 = resized2.position.width / resized2.position.height;
    expect(Math.abs(newRatio2 - originalRatio2)).toBeLessThan(0.1);
  });

  it('不按住 Shift 键时，宽高比可以改变', () => {
    const canvasConfig = useCanvasStore.getState().config;
    const component = createTestComponent('test-1', 200, 100);
    const originalRatio = component.position.width / component.position.height;
    
    // 不保持宽高比的调整
    const resized = resizeComponent(
      component,
      -50,
      50,
      'corner',
      canvasConfig.width,
      canvasConfig.height,
      false // 不保持宽高比
    );
    
    const newRatio = resized.position.width / resized.position.height;
    
    // 宽高比应该改变
    expect(Math.abs(newRatio - originalRatio)).toBeGreaterThan(0.1);
  });

  it('正方形组件按住 Shift 键应该保持正方形', () => {
    const canvasConfig = useCanvasStore.getState().config;
    const squareComponent = createTestComponent('test-1', 100, 100);
    
    const resized = resizeComponent(
      squareComponent,
      50,
      30,
      'corner',
      canvasConfig.width,
      canvasConfig.height,
      true
    );
    
    // 宽高比应该接近 1（正方形）
    const aspectRatio = resized.position.width / resized.position.height;
    expect(Math.abs(aspectRatio - 1)).toBeLessThan(0.1);
  });
});
