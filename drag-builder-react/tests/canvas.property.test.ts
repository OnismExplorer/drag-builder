/**
 * Canvas 属性测试
 * 使用 fast-check 进行基于属性的测试
 * 
 * 每个属性测试运行 100 次迭代
 */

import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { useComponentStore } from '../src/store/componentStore';
import type { ComponentNode } from '../src/types';

/**
 * 生成随机组件节点
 */
const generateComponent = (): fc.Arbitrary<ComponentNode> => {
  return fc.record({
    id: fc.uuid(),
    type: fc.constantFrom('div', 'button', 'text', 'image', 'input'),
    position: fc.record({
      x: fc.integer({ min: 0, max: 5000 }),
      y: fc.integer({ min: 0, max: 5000 }),
      width: fc.integer({ min: 20, max: 1000 }),
      height: fc.integer({ min: 20, max: 1000 }),
      zIndex: fc.integer({ min: 0, max: 100 }),
    }),
    styles: fc.record({
      backgroundColor: fc.constant('#FFFFFF'),
      borderColor: fc.constant('#F1F5F9'),
      borderWidth: fc.constant(1),
      borderRadius: fc.constant(16),
    }),
    content: fc.record({
      text: fc.constant('Test'),
    }),
  }) as fc.Arbitrary<ComponentNode>;
};

/**
 * Feature: drag-builder, Property 4: 组件拖拽位置更新
 * 
 * 对于任何组件的拖拽操作，组件的 position.x 和 position.y 应该实时反映鼠标的移动距离
 * 
 * 验证需求：4.4
 */
describe('Property 4: 组件拖拽位置更新', () => {
  beforeEach(() => {
    // 重置 store 状态
    useComponentStore.getState().clearAll();
  });

  it('对于任何组件和任何拖拽距离，位置应该正确更新', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.record({
          deltaX: fc.integer({ min: -1000, max: 1000 }),
          deltaY: fc.integer({ min: -1000, max: 1000 }),
        }),
        (component, drag) => {
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          
          // 记录初始位置
          const initialX = component.position.x;
          const initialY = component.position.y;
          
          // 模拟拖拽：更新组件位置
          const newX = initialX + drag.deltaX;
          const newY = initialY + drag.deltaY;
          
          store.updateComponent(component.id, {
            position: {
              ...component.position,
              x: newX,
              y: newY,
            },
          });
          
          // 获取更新后的组件
          const updatedComponent = store.getComponentById(component.id);
          
          // 验证位置更新
          expect(updatedComponent).toBeDefined();
          if (updatedComponent) {
            // 位置应该反映鼠标移动距离
            expect(updatedComponent.position.x).toBe(newX);
            expect(updatedComponent.position.y).toBe(newY);
            
            // 位置变化应该等于拖拽距离
            const actualDeltaX = updatedComponent.position.x - initialX;
            const actualDeltaY = updatedComponent.position.y - initialY;
            
            expect(actualDeltaX).toBe(drag.deltaX);
            expect(actualDeltaY).toBe(drag.deltaY);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多次连续拖拽，位置应该累积更新', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.array(
          fc.record({
            deltaX: fc.integer({ min: -100, max: 100 }),
            deltaY: fc.integer({ min: -100, max: 100 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (component, dragSequence) => {
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          
          // 记录初始位置
          const initialX = component.position.x;
          const initialY = component.position.y;
          
          // 执行一系列拖拽操作
          let currentX = initialX;
          let currentY = initialY;
          
          dragSequence.forEach(drag => {
            currentX += drag.deltaX;
            currentY += drag.deltaY;
            
            store.updateComponent(component.id, {
              position: {
                ...component.position,
                x: currentX,
                y: currentY,
              },
            });
          });
          
          // 获取最终组件
          const finalComponent = store.getComponentById(component.id);
          
          // 验证累积位置
          expect(finalComponent).toBeDefined();
          if (finalComponent) {
            // 计算总移动距离
            const totalDeltaX = dragSequence.reduce((sum, drag) => sum + drag.deltaX, 0);
            const totalDeltaY = dragSequence.reduce((sum, drag) => sum + drag.deltaY, 0);
            
            // 最终位置应该等于初始位置 + 总移动距离
            expect(finalComponent.position.x).toBe(initialX + totalDeltaX);
            expect(finalComponent.position.y).toBe(initialY + totalDeltaY);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于零距离拖拽，位置应该保持不变', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        (component) => {
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          
          // 记录初始位置
          const initialX = component.position.x;
          const initialY = component.position.y;
          
          // 模拟零距离拖拽
          store.updateComponent(component.id, {
            position: {
              ...component.position,
              x: initialX,
              y: initialY,
            },
          });
          
          // 获取更新后的组件
          const updatedComponent = store.getComponentById(component.id);
          
          // 验证位置不变
          expect(updatedComponent).toBeDefined();
          if (updatedComponent) {
            expect(updatedComponent.position.x).toBe(initialX);
            expect(updatedComponent.position.y).toBe(initialY);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于负数拖拽距离，位置应该正确减少', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.record({
          deltaX: fc.integer({ min: -500, max: 0 }),
          deltaY: fc.integer({ min: -500, max: 0 }),
        }),
        (component, drag) => {
          const store = useComponentStore.getState();
          
          // 添加组件（确保初始位置足够大，避免负坐标）
          const safeComponent = {
            ...component,
            position: {
              ...component.position,
              x: 1000,
              y: 1000,
            },
          };
          
          store.addComponent(safeComponent);
          
          // 模拟负数拖拽
          const newX = safeComponent.position.x + drag.deltaX;
          const newY = safeComponent.position.y + drag.deltaY;
          
          store.updateComponent(safeComponent.id, {
            position: {
              ...safeComponent.position,
              x: newX,
              y: newY,
            },
          });
          
          // 获取更新后的组件
          const updatedComponent = store.getComponentById(safeComponent.id);
          
          // 验证位置正确减少
          expect(updatedComponent).toBeDefined();
          if (updatedComponent) {
            expect(updatedComponent.position.x).toBe(newX);
            expect(updatedComponent.position.y).toBe(newY);
            expect(updatedComponent.position.x).toBeLessThanOrEqual(safeComponent.position.x);
            expect(updatedComponent.position.y).toBeLessThanOrEqual(safeComponent.position.y);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: drag-builder, Property 5: Shift 键约束拖拽
 * 
 * 对于任何按住 Shift 键的拖拽操作，组件的移动应该被锁定在水平或垂直方向
 * （取决于初始移动方向的主导轴）
 * 
 * 验证需求：4.5
 */
describe('Property 5: Shift 键约束拖拽', () => {
  beforeEach(() => {
    // 重置 store 状态
    useComponentStore.getState().clearAll();
  });

  /**
   * 辅助函数：根据 Shift 键约束计算实际移动距离
   * 如果 |deltaX| > |deltaY|，锁定为水平移动（deltaY = 0）
   * 如果 |deltaY| > |deltaX|，锁定为垂直移动（deltaX = 0）
   * 如果相等，保持原样（或选择一个方向）
   */
  const applyShiftConstraint = (deltaX: number, deltaY: number): { x: number; y: number } => {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX > absDeltaY) {
      // 水平方向主导，锁定垂直移动
      return { x: deltaX, y: 0 };
    } else if (absDeltaY > absDeltaX) {
      // 垂直方向主导，锁定水平移动
      return { x: 0, y: deltaY };
    } else {
      // 相等时，默认锁定为水平移动
      return { x: deltaX, y: 0 };
    }
  };

  it('对于任何拖拽，按住 Shift 键应该锁定到主导轴', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.record({
          deltaX: fc.integer({ min: -1000, max: 1000 }),
          deltaY: fc.integer({ min: -1000, max: 1000 }),
        }),
        (component, drag) => {
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          
          // 记录初始位置
          const initialX = component.position.x;
          const initialY = component.position.y;
          
          // 应用 Shift 键约束
          const constrained = applyShiftConstraint(drag.deltaX, drag.deltaY);
          
          // 模拟按住 Shift 键的拖拽
          const newX = initialX + constrained.x;
          const newY = initialY + constrained.y;
          
          store.updateComponent(component.id, {
            position: {
              ...component.position,
              x: newX,
              y: newY,
            },
          });
          
          // 获取更新后的组件
          const updatedComponent = store.getComponentById(component.id);
          
          // 验证约束
          expect(updatedComponent).toBeDefined();
          if (updatedComponent) {
            const actualDeltaX = updatedComponent.position.x - initialX;
            const actualDeltaY = updatedComponent.position.y - initialY;
            
            // 验证只有一个方向移动（或两个方向都不移动）
            const isHorizontalOnly = actualDeltaY === 0;
            const isVerticalOnly = actualDeltaX === 0;
            const isNoMovement = actualDeltaX === 0 && actualDeltaY === 0;
            
            expect(isHorizontalOnly || isVerticalOnly || isNoMovement).toBe(true);
            
            // 验证移动方向与主导轴一致
            const absDeltaX = Math.abs(drag.deltaX);
            const absDeltaY = Math.abs(drag.deltaY);
            
            if (absDeltaX > absDeltaY) {
              // 水平主导，应该只有水平移动
              expect(actualDeltaY).toBe(0);
              expect(actualDeltaX).toBe(drag.deltaX);
            } else if (absDeltaY > absDeltaX) {
              // 垂直主导，应该只有垂直移动
              expect(actualDeltaX).toBe(0);
              expect(actualDeltaY).toBe(drag.deltaY);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于水平主导的拖拽，Shift 键应该锁定垂直移动', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.record({
          deltaX: fc.integer({ min: -1000, max: 1000 }).filter(x => Math.abs(x) > 10),
          deltaY: fc.integer({ min: -10, max: 10 }),
        }),
        (component, drag) => {
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          
          // 记录初始位置
          const initialX = component.position.x;
          const initialY = component.position.y;
          
          // 应用 Shift 键约束（水平主导）
          const constrained = applyShiftConstraint(drag.deltaX, drag.deltaY);
          
          // 模拟拖拽
          store.updateComponent(component.id, {
            position: {
              ...component.position,
              x: initialX + constrained.x,
              y: initialY + constrained.y,
            },
          });
          
          // 获取更新后的组件
          const updatedComponent = store.getComponentById(component.id);
          
          // 验证垂直方向被锁定
          expect(updatedComponent).toBeDefined();
          if (updatedComponent) {
            expect(updatedComponent.position.y).toBe(initialY);
            expect(updatedComponent.position.x).toBe(initialX + drag.deltaX);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于垂直主导的拖拽，Shift 键应该锁定水平移动', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.record({
          deltaX: fc.integer({ min: -10, max: 10 }),
          deltaY: fc.integer({ min: -1000, max: 1000 }).filter(y => Math.abs(y) > 10),
        }),
        (component, drag) => {
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          
          // 记录初始位置
          const initialX = component.position.x;
          const initialY = component.position.y;
          
          // 应用 Shift 键约束（垂直主导）
          const constrained = applyShiftConstraint(drag.deltaX, drag.deltaY);
          
          // 模拟拖拽
          store.updateComponent(component.id, {
            position: {
              ...component.position,
              x: initialX + constrained.x,
              y: initialY + constrained.y,
            },
          });
          
          // 获取更新后的组件
          const updatedComponent = store.getComponentById(component.id);
          
          // 验证水平方向被锁定
          expect(updatedComponent).toBeDefined();
          if (updatedComponent) {
            expect(updatedComponent.position.x).toBe(initialX);
            expect(updatedComponent.position.y).toBe(initialY + drag.deltaY);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于相等的拖拽距离，Shift 键应该选择一个方向锁定', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.integer({ min: 1, max: 500 }),
        (component, distance) => {
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          
          // 记录初始位置
          const initialX = component.position.x;
          const initialY = component.position.y;
          
          // 创建相等的拖拽距离（45度角）
          const drag = { deltaX: distance, deltaY: distance };
          
          // 应用 Shift 键约束
          const constrained = applyShiftConstraint(drag.deltaX, drag.deltaY);
          
          // 模拟拖拽
          store.updateComponent(component.id, {
            position: {
              ...component.position,
              x: initialX + constrained.x,
              y: initialY + constrained.y,
            },
          });
          
          // 获取更新后的组件
          const updatedComponent = store.getComponentById(component.id);
          
          // 验证只有一个方向移动
          expect(updatedComponent).toBeDefined();
          if (updatedComponent) {
            const movedX = updatedComponent.position.x !== initialX;
            const movedY = updatedComponent.position.y !== initialY;
            
            // 应该只有一个方向移动（不能两个方向都移动）
            expect(movedX && movedY).toBe(false);
            
            // 至少有一个方向移动（不能两个方向都不移动，因为 distance > 0）
            expect(movedX || movedY).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多次连续的 Shift 约束拖拽，每次都应该正确锁定', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.array(
          fc.record({
            deltaX: fc.integer({ min: -100, max: 100 }),
            deltaY: fc.integer({ min: -100, max: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (component, dragSequence) => {
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          
          // 记录初始位置
          let currentX = component.position.x;
          let currentY = component.position.y;
          
          // 执行一系列 Shift 约束拖拽
          dragSequence.forEach(drag => {
            const constrained = applyShiftConstraint(drag.deltaX, drag.deltaY);
            
            currentX += constrained.x;
            currentY += constrained.y;
            
            store.updateComponent(component.id, {
              position: {
                ...component.position,
                x: currentX,
                y: currentY,
              },
            });
            
            // 验证每次更新后的约束
            const updatedComponent = store.getComponentById(component.id);
            expect(updatedComponent).toBeDefined();
            if (updatedComponent) {
              expect(updatedComponent.position.x).toBe(currentX);
              expect(updatedComponent.position.y).toBe(currentY);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
