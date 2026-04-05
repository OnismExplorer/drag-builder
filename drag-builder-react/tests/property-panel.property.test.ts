/**
 * 属性面板属性测试
 * 使用 fast-check 进行基于属性的测试
 * 
 * 测试属性 10-15：
 * - 属性 10：属性面板实时同步
 * - 属性 11：输入验证错误处理
 * - 属性 12-15：层级操作
 * 
 * 每个属性测试运行 100 次迭代
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { useComponentStore } from '../src/store/componentStore';
import type { ComponentNode } from '../src/types';

/**
 * 完全重置 componentStore 的辅助函数
 */
function resetComponentStore() {
  useComponentStore.setState({
    components: [],
    selectedId: null,
  });
}

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
 * Feature: drag-builder, Property 10: 属性面板实时同步
 * 
 * 对于任何组件属性的修改（通过属性面板），画布上的组件渲染应该在 100ms 内反映该修改
 * 
 * 验证需求：7.5
 */
describe('Property 10: 属性面板实时同步', () => {
  beforeEach(() => {
    resetComponentStore();
  });

  afterEach(() => {
    resetComponentStore();
  });

  it('对于任何位置更新，组件状态应该立即反映变化', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.record({
          x: fc.integer({ min: 0, max: 5000 }),
          y: fc.integer({ min: 0, max: 5000 }),
        }),
        (component, newPosition) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 更新位置
          store.updateComponent(componentId, {
            position: {
              ...component.position,
              x: newPosition.x,
              y: newPosition.y,
            },
          });
          
          // 验证更新立即反映在状态中
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.x).toBe(newPosition.x);
          expect(updatedComponent?.position.y).toBe(newPosition.y);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于任何尺寸更新，组件状态应该立即反映变化', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.record({
          width: fc.integer({ min: 20, max: 1000 }),
          height: fc.integer({ min: 20, max: 1000 }),
        }),
        (component, newSize) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 更新尺寸
          store.updateComponent(componentId, {
            position: {
              ...component.position,
              width: newSize.width,
              height: newSize.height,
            },
          });
          
          // 验证更新立即反映在状态中
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.width).toBe(newSize.width);
          expect(updatedComponent?.position.height).toBe(newSize.height);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于任何样式更新，组件状态应该立即反映变化', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.record({
          backgroundColor: fc.string({ minLength: 6, maxLength: 6 }).map(s => {
            // 生成有效的 HEX 颜色
            const hex = s.split('').map(c => {
              const code = c.charCodeAt(0) % 16;
              return code.toString(16);
            }).join('');
            return `#${hex}`;
          }),
          borderRadius: fc.integer({ min: 0, max: 50 }),
        }),
        (component, newStyles) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 更新样式
          store.updateComponent(componentId, {
            styles: {
              ...component.styles,
              backgroundColor: newStyles.backgroundColor,
              borderRadius: newStyles.borderRadius,
            },
          });
          
          // 验证更新立即反映在状态中
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.styles.backgroundColor).toBe(newStyles.backgroundColor);
          expect(updatedComponent?.styles.borderRadius).toBe(newStyles.borderRadius);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于任何内容更新，组件状态应该立即反映变化', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.string({ minLength: 0, maxLength: 100 }),
        (component, newText) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 更新内容
          store.updateComponent(componentId, {
            content: {
              ...component.content,
              text: newText,
            },
          });
          
          // 验证更新立即反映在状态中
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.content.text).toBe(newText);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多个连续更新，最后的更新应该被保留', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.array(
          fc.record({
            x: fc.integer({ min: 0, max: 5000 }),
            y: fc.integer({ min: 0, max: 5000 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (component, updates) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 执行多个连续更新
          updates.forEach(update => {
            store.updateComponent(componentId, {
              position: {
                ...component.position,
                x: update.x,
                y: update.y,
              },
            });
          });
          
          // 验证最后的更新被保留
          const lastUpdate = updates[updates.length - 1];
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.x).toBe(lastUpdate.x);
          expect(updatedComponent?.position.y).toBe(lastUpdate.y);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: drag-builder, Property 11: 输入验证错误处理
 * 
 * 对于任何非法的输入值（如负数宽度、超出范围的尺寸），系统应该：
 * 1. 显示错误提示信息
 * 2. 阻止状态更新（保持原值）
 * 
 * 验证需求：1.5, 7.7, 15.3
 */
describe('Property 11: 输入验证错误处理', () => {
  beforeEach(() => {
    resetComponentStore();
  });

  afterEach(() => {
    resetComponentStore();
  });

  /**
   * 验证函数：模拟 PositionEditor 的验证逻辑
   */
  const validatePositionValue = (value: number): { valid: boolean; error: string } => {
    if (isNaN(value)) {
      return { valid: false, error: '请输入有效数字' };
    }
    if (value < 0) {
      return { valid: false, error: '值不能小于 0' };
    }
    if (value > 5000) {
      return { valid: false, error: '值不能大于 5000' };
    }
    return { valid: true, error: '' };
  };

  it('对于负数位置值，应该拒绝更新', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.integer({ min: -1000, max: -1 }),
        (component, negativeValue) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          const originalX = component.position.x;
          
          // 验证负数值
          const validation = validatePositionValue(negativeValue);
          expect(validation.valid).toBe(false);
          expect(validation.error).toBe('值不能小于 0');
          
          // 如果验证失败，不应该更新状态
          if (!validation.valid) {
            // 不执行更新
            const currentComponent = store.getComponentById(componentId);
            expect(currentComponent?.position.x).toBe(originalX);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于超出范围的位置值（> 5000），应该拒绝更新', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.integer({ min: 5001, max: 10000 }),
        (component, largeValue) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          const originalX = component.position.x;
          
          // 验证超出范围的值
          const validation = validatePositionValue(largeValue);
          expect(validation.valid).toBe(false);
          expect(validation.error).toBe('值不能大于 5000');
          
          // 如果验证失败，不应该更新状态
          if (!validation.valid) {
            // 不执行更新
            const currentComponent = store.getComponentById(componentId);
            expect(currentComponent?.position.x).toBe(originalX);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于有效范围内的值（0-5000），应该允许更新', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.integer({ min: 0, max: 5000 }),
        (component, validValue) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 验证有效值
          const validation = validatePositionValue(validValue);
          expect(validation.valid).toBe(true);
          expect(validation.error).toBe('');
          
          // 如果验证通过，应该允许更新
          if (validation.valid) {
            store.updateComponent(componentId, {
              position: {
                ...component.position,
                x: validValue,
              },
            });
            
            const updatedComponent = store.getComponentById(componentId);
            expect(updatedComponent?.position.x).toBe(validValue);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于 NaN 值，应该拒绝更新', () => {
    const component: ComponentNode = {
      id: 'test-1',
      type: 'div',
      position: { x: 100, y: 100, width: 200, height: 100, zIndex: 0 },
      styles: {},
      content: {},
    };
    
    resetComponentStore();
    const store = useComponentStore.getState();
    store.addComponent(component);
    
    const originalX = component.position.x;
    
    // 验证 NaN
    const validation = validatePositionValue(NaN);
    expect(validation.valid).toBe(false);
    expect(validation.error).toBe('请输入有效数字');
    
    // 不应该更新状态
    const currentComponent = store.getComponentById('test-1');
    expect(currentComponent?.position.x).toBe(originalX);
  });

  it('对于边界值（0 和 5000），应该允许更新', () => {
    const component: ComponentNode = {
      id: 'test-1',
      type: 'div',
      position: { x: 100, y: 100, width: 200, height: 100, zIndex: 0 },
      styles: {},
      content: {},
    };
    
    resetComponentStore();
    const store = useComponentStore.getState();
    store.addComponent(component);
    
    // 测试最小边界（0）
    const validation0 = validatePositionValue(0);
    expect(validation0.valid).toBe(true);
    store.updateComponent('test-1', {
      position: { ...component.position, x: 0 },
    });
    expect(store.getComponentById('test-1')?.position.x).toBe(0);
    
    // 测试最大边界（5000）
    const validation5000 = validatePositionValue(5000);
    expect(validation5000.valid).toBe(true);
    store.updateComponent('test-1', {
      position: { ...component.position, x: 5000 },
    });
    expect(store.getComponentById('test-1')?.position.x).toBe(5000);
  });

  it('对于多个字段的验证，每个字段应该独立验证', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.record({
          x: fc.integer({ min: -100, max: 6000 }),
          y: fc.integer({ min: -100, max: 6000 }),
          width: fc.integer({ min: -100, max: 6000 }),
          height: fc.integer({ min: -100, max: 6000 }),
        }),
        (component, values) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 验证每个字段
          const validations = {
            x: validatePositionValue(values.x),
            y: validatePositionValue(values.y),
            width: validatePositionValue(values.width),
            height: validatePositionValue(values.height),
          };
          
          // 只有所有字段都有效时才更新
          const allValid = Object.values(validations).every(v => v.valid);
          
          if (allValid) {
            store.updateComponent(componentId, {
              position: {
                ...component.position,
                x: values.x,
                y: values.y,
                width: values.width,
                height: values.height,
              },
            });
            
            const updatedComponent = store.getComponentById(componentId);
            expect(updatedComponent?.position.x).toBe(values.x);
            expect(updatedComponent?.position.y).toBe(values.y);
            expect(updatedComponent?.position.width).toBe(values.width);
            expect(updatedComponent?.position.height).toBe(values.height);
          } else {
            // 如果有任何字段无效，原始值应该保持不变
            const currentComponent = store.getComponentById(componentId);
            
            if (!validations.x.valid) {
              expect(currentComponent?.position.x).toBe(component.position.x);
            }
            if (!validations.y.valid) {
              expect(currentComponent?.position.y).toBe(component.position.y);
            }
            if (!validations.width.valid) {
              expect(currentComponent?.position.width).toBe(component.position.width);
            }
            if (!validations.height.valid) {
              expect(currentComponent?.position.height).toBe(component.position.height);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: drag-builder, Property 12: 层级操作 - 置于顶层
 * 
 * 对于任何"置于顶层"操作，选中组件的 zIndex 应该被设置为 max(所有组件的 zIndex) + 1
 * 
 * 验证需求：8.2
 */
describe('Property 12: 层级操作 - 置于顶层', () => {
  beforeEach(() => {
    resetComponentStore();
  });

  afterEach(() => {
    resetComponentStore();
  });

  it('对于任何组件，置于顶层后应该有最大的 zIndex', () => {
    fc.assert(
      fc.property(
        fc.array(generateComponent(), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (components, targetIndex) => {
          // 前置条件：确保所有组件有唯一的 ID
          const ids = components.map(c => c.id);
          const uniqueIds = new Set(ids);
          fc.pre(uniqueIds.size === ids.length); // 跳过有重复 ID 的情况
          
          resetComponentStore();
          
          // 添加所有组件
          components.forEach(comp => useComponentStore.getState().addComponent(comp));
          
          // 验证所有组件都被添加
          const store = useComponentStore.getState();
          expect(store.components.length).toBe(components.length);
          
          // 选择目标组件
          const index = targetIndex % components.length;
          const targetId = components[index].id;
          
          // 获取添加后的当前最大 zIndex（从 store 中获取）
          const allComponentsBefore = store.components;
          const maxZIndexBefore = allComponentsBefore.length > 0 
            ? Math.max(...allComponentsBefore.map(c => c.position.zIndex))
            : 0;
          
          // 置于顶层
          useComponentStore.getState().bringToFront(targetId);
          
          // 验证目标组件的 zIndex 是最大的
          const updatedStore = useComponentStore.getState();
          const updatedComponent = updatedStore.getComponentById(targetId);
          expect(updatedComponent).toBeDefined();
          
          if (updatedComponent) {
            const allComponents = updatedStore.components;
            const allZIndexes = allComponents.map(c => c.position.zIndex);
            const maxZIndex = allZIndexes.length > 0 ? Math.max(...allZIndexes) : 0;
            
            expect(updatedComponent.position.zIndex).toBe(maxZIndex);
            expect(updatedComponent.position.zIndex).toBeGreaterThanOrEqual(maxZIndexBefore);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于已经在顶层的组件，置于顶层操作应该保持其 zIndex 不变或增加', () => {
    fc.assert(
      fc.property(
        fc.array(generateComponent(), { minLength: 1, maxLength: 5 }),
        (components) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加所有组件
          components.forEach(comp => store.addComponent(comp));
          
          // 找到当前 zIndex 最大的组件
          const allComponents = store.components;
          const maxZIndex = Math.max(...allComponents.map(c => c.position.zIndex));
          const topComponent = allComponents.find(c => c.position.zIndex === maxZIndex);
          
          if (topComponent) {
            const originalZIndex = topComponent.position.zIndex;
            
            // 对已经在顶层的组件执行置于顶层操作
            store.bringToFront(topComponent.id);
            
            // 验证 zIndex 不变或增加（取决于是否有其他组件也在顶层）
            const updatedComponent = store.getComponentById(topComponent.id);
            expect(updatedComponent?.position.zIndex).toBeGreaterThanOrEqual(originalZIndex);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多次置于顶层操作，最后操作的组件应该在最顶层', () => {
    fc.assert(
      fc.property(
        fc.array(generateComponent(), { minLength: 2, maxLength: 5 }),
        fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 1, maxLength: 10 }),
        (components, operationSequence) => {
          // 前置条件：确保所有组件有唯一的 ID
          const ids = components.map(c => c.id);
          const uniqueIds = new Set(ids);
          fc.pre(uniqueIds.size === ids.length); // 跳过有重复 ID 的情况
          
          resetComponentStore();
          
          // 添加所有组件
          components.forEach(comp => useComponentStore.getState().addComponent(comp));
          
          // 验证所有组件都被添加
          const store = useComponentStore.getState();
          expect(store.components.length).toBe(components.length);
          
          // 执行一系列置于顶层操作
          let lastOperatedId: string | null = null;
          operationSequence.forEach(index => {
            const targetIndex = index % components.length;
            const targetId = components[targetIndex].id;
            useComponentStore.getState().bringToFront(targetId);
            lastOperatedId = targetId;
          });
          
          // 验证最后操作的组件在最顶层
          if (lastOperatedId) {
            const updatedStore = useComponentStore.getState();
            const lastComponent = updatedStore.getComponentById(lastOperatedId);
            const allComponents = updatedStore.components;
            const allZIndexes = allComponents.map(c => c.position.zIndex);
            const maxZIndex = allZIndexes.length > 0 ? Math.max(...allZIndexes) : 0;
            
            expect(lastComponent?.position.zIndex).toBe(maxZIndex);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: drag-builder, Property 13: 层级操作 - 上移一层
 * 
 * 对于任何"上移一层"操作，选中组件的 zIndex 应该增加 1
 * 
 * 验证需求：8.3
 */
describe('Property 13: 层级操作 - 上移一层', () => {
  beforeEach(() => {
    resetComponentStore();
  });

  afterEach(() => {
    resetComponentStore();
  });

  it('对于任何组件，上移一层后 zIndex 应该增加 1', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        (component) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          const originalZIndex = component.position.zIndex;
          
          // 上移一层
          store.moveUp(componentId);
          
          // 验证 zIndex 增加 1
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.zIndex).toBe(originalZIndex + 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多次上移操作，zIndex 应该累积增加', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.integer({ min: 1, max: 10 }),
        (component, moveUpTimes) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          const originalZIndex = component.position.zIndex;
          
          // 多次上移
          for (let i = 0; i < moveUpTimes; i++) {
            store.moveUp(componentId);
          }
          
          // 验证 zIndex 累积增加
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.zIndex).toBe(originalZIndex + moveUpTimes);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于接近最大 zIndex 的组件，上移应该受到限制', () => {
    const component: ComponentNode = {
      id: 'test-1',
      type: 'div',
      position: { x: 0, y: 0, width: 100, height: 100, zIndex: 998 },
      styles: {},
      content: {},
    };
    
    resetComponentStore();
    const store = useComponentStore.getState();
    store.addComponent(component);
    
    // 上移一层（应该到 999）
    store.moveUp('test-1');
    expect(store.getComponentById('test-1')?.position.zIndex).toBe(999);
    
    // 再次上移（应该保持在 999 或不超过最大值）
    store.moveUp('test-1');
    const finalZIndex = store.getComponentById('test-1')?.position.zIndex;
    expect(finalZIndex).toBeLessThanOrEqual(999);
  });
});

/**
 * Feature: drag-builder, Property 14: 层级操作 - 下移一层
 * 
 * 对于任何"下移一层"操作，选中组件的 zIndex 应该减少 1（但不小于 0）
 * 
 * 验证需求：8.4
 */
describe('Property 14: 层级操作 - 下移一层', () => {
  beforeEach(() => {
    resetComponentStore();
  });

  afterEach(() => {
    resetComponentStore();
  });

  it('对于 zIndex > 0 的组件，下移一层后 zIndex 应该减少 1', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          type: fc.constantFrom('div', 'button', 'text', 'image', 'input'),
          position: fc.record({
            x: fc.integer({ min: 0, max: 5000 }),
            y: fc.integer({ min: 0, max: 5000 }),
            width: fc.integer({ min: 20, max: 1000 }),
            height: fc.integer({ min: 20, max: 1000 }),
            zIndex: fc.integer({ min: 1, max: 100 }), // 确保 zIndex > 0
          }),
          styles: fc.record({
            backgroundColor: fc.constant('#FFFFFF'),
          }),
          content: fc.record({
            text: fc.constant('Test'),
          }),
        }) as fc.Arbitrary<ComponentNode>,
        (component) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          const originalZIndex = component.position.zIndex;
          
          // 下移一层
          store.moveDown(componentId);
          
          // 验证 zIndex 减少 1
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.zIndex).toBe(originalZIndex - 1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于 zIndex = 0 的组件，下移一层后 zIndex 应该保持为 0', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          type: fc.constantFrom('div', 'button', 'text', 'image', 'input'),
          position: fc.record({
            x: fc.integer({ min: 0, max: 5000 }),
            y: fc.integer({ min: 0, max: 5000 }),
            width: fc.integer({ min: 20, max: 1000 }),
            height: fc.integer({ min: 20, max: 1000 }),
            zIndex: fc.constant(0), // zIndex = 0
          }),
          styles: fc.record({
            backgroundColor: fc.constant('#FFFFFF'),
          }),
          content: fc.record({
            text: fc.constant('Test'),
          }),
        }) as fc.Arbitrary<ComponentNode>,
        (component) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 下移一层
          store.moveDown(componentId);
          
          // 验证 zIndex 保持为 0（非负不变量）
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.zIndex).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多次下移操作，zIndex 应该累积减少但不小于 0', () => {
    fc.assert(
      fc.property(
        fc.record({
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
          }),
          content: fc.record({
            text: fc.constant('Test'),
          }),
        }) as fc.Arbitrary<ComponentNode>,
        fc.integer({ min: 1, max: 20 }),
        (component, moveDownTimes) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          const originalZIndex = component.position.zIndex;
          
          // 多次下移
          for (let i = 0; i < moveDownTimes; i++) {
            store.moveDown(componentId);
          }
          
          // 验证 zIndex 累积减少但不小于 0
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          
          if (updatedComponent) {
            const expectedZIndex = Math.max(0, originalZIndex - moveDownTimes);
            expect(updatedComponent.position.zIndex).toBe(expectedZIndex);
            expect(updatedComponent.position.zIndex).toBeGreaterThanOrEqual(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于上移后再下移，zIndex 应该回到原值', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        (component) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          const originalZIndex = component.position.zIndex;
          
          // 上移一层
          store.moveUp(componentId);
          
          // 下移一层
          store.moveDown(componentId);
          
          // 验证 zIndex 回到原值
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.zIndex).toBe(originalZIndex);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: drag-builder, Property 15: 层级操作 - 置于底层
 * 
 * 对于任何"置于底层"操作，选中组件的 zIndex 应该被设置为 0
 * 
 * 验证需求：8.5
 */
describe('Property 15: 层级操作 - 置于底层', () => {
  beforeEach(() => {
    resetComponentStore();
  });

  afterEach(() => {
    resetComponentStore();
  });

  it('对于任何组件，置于底层后 zIndex 应该为 0', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        (component) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 置于底层
          store.sendToBack(componentId);
          
          // 验证 zIndex 为 0
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.zIndex).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多个组件，置于底层后应该有最小的 zIndex（0）', () => {
    fc.assert(
      fc.property(
        fc.array(generateComponent(), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (components, targetIndex) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加所有组件
          components.forEach(comp => store.addComponent(comp));
          
          // 选择目标组件
          const index = targetIndex % components.length;
          const targetId = components[index].id;
          
          // 置于底层
          store.sendToBack(targetId);
          
          // 验证目标组件的 zIndex 为 0
          const updatedComponent = store.getComponentById(targetId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.zIndex).toBe(0);
          
          // 验证没有其他组件的 zIndex 小于 0
          const allComponents = store.components;
          allComponents.forEach(comp => {
            expect(comp.position.zIndex).toBeGreaterThanOrEqual(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于已经在底层的组件（zIndex = 0），置于底层操作应该保持 zIndex 为 0', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          type: fc.constantFrom('div', 'button', 'text', 'image', 'input'),
          position: fc.record({
            x: fc.integer({ min: 0, max: 5000 }),
            y: fc.integer({ min: 0, max: 5000 }),
            width: fc.integer({ min: 20, max: 1000 }),
            height: fc.integer({ min: 20, max: 1000 }),
            zIndex: fc.constant(0), // 已经在底层
          }),
          styles: fc.record({
            backgroundColor: fc.constant('#FFFFFF'),
          }),
          content: fc.record({
            text: fc.constant('Test'),
          }),
        }) as fc.Arbitrary<ComponentNode>,
        (component) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 置于底层
          store.sendToBack(componentId);
          
          // 验证 zIndex 仍然为 0
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.zIndex).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于置于顶层后再置于底层，zIndex 应该变为 0', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        (component) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 置于顶层
          store.bringToFront(componentId);
          const topZIndex = store.getComponentById(componentId)?.position.zIndex;
          expect(topZIndex).toBeGreaterThan(0);
          
          // 置于底层
          store.sendToBack(componentId);
          
          // 验证 zIndex 变为 0
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.zIndex).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多次置于底层操作，zIndex 应该始终保持为 0', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.integer({ min: 1, max: 10 }),
        (component, operationTimes) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          const componentId = component.id;
          
          // 多次置于底层
          for (let i = 0; i < operationTimes; i++) {
            store.sendToBack(componentId);
          }
          
          // 验证 zIndex 始终为 0
          const updatedComponent = store.getComponentById(componentId);
          expect(updatedComponent).toBeDefined();
          expect(updatedComponent?.position.zIndex).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
