/**
 * Store 属性测试
 * 使用 fast-check 进行基于属性的测试
 * 
 * 每个属性测试运行 100 次迭代
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { useCanvasStore } from '../src/store/canvasStore';
import { useComponentStore } from '../src/store/componentStore';
import type { ComponentNode } from '../src/types';

/**
 * 完全重置 componentStore 的辅助函数
 * 解决 Zustand store 在测试迭代间共享状态的问题
 */
function resetComponentStore() {
  // 使用 setState 直接重置整个状态对象
  useComponentStore.setState({
    components: [],
    selectedId: null,
  });
}

/**
 * Feature: drag-builder, Property 1: 画布缩放边界不变量
 * 
 * 对于任何画布缩放操作，缩放值应该始终保持在 0.1 到 2.0 之间（10% 到 200%）
 * 
 * 验证需求：2.3
 */
describe('Property 1: 画布缩放边界不变量', () => {
  beforeEach(() => {
    // 重置 store 状态
    useCanvasStore.getState().resetCanvas();
  });

  it('对于任何缩放值输入，实际缩放值应该在 0.1 到 2.0 之间', () => {
    fc.assert(
      fc.property(
        // 生成任意数字，包括负数、零、极大值、极小值
        fc.double({ min: -1000, max: 1000, noNaN: true }),
        (zoomInput) => {
          const store = useCanvasStore.getState();
          
          // 尝试设置缩放值
          store.setZoom(zoomInput);
          
          // 获取实际的缩放值
          const actualZoom = useCanvasStore.getState().zoom;
          
          // 验证边界不变量
          expect(actualZoom).toBeGreaterThanOrEqual(0.1);
          expect(actualZoom).toBeLessThanOrEqual(2.0);
          
          // 额外验证：缩放值应该是有限数字
          expect(Number.isFinite(actualZoom)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于边界值，应该正确处理', () => {
    const store = useCanvasStore.getState();
    
    // 测试最小边界
    store.setZoom(0.1);
    expect(useCanvasStore.getState().zoom).toBe(0.1);
    
    // 测试最大边界
    store.setZoom(2.0);
    expect(useCanvasStore.getState().zoom).toBe(2.0);
    
    // 测试小于最小值
    store.setZoom(0.05);
    expect(useCanvasStore.getState().zoom).toBe(0.1);
    
    // 测试大于最大值
    store.setZoom(3.0);
    expect(useCanvasStore.getState().zoom).toBe(2.0);
  });

  it('对于特殊值，应该正确处理', () => {
    const store = useCanvasStore.getState();
    
    // 测试零
    store.setZoom(0);
    expect(useCanvasStore.getState().zoom).toBe(0.1);
    
    // 测试负数
    store.setZoom(-1);
    expect(useCanvasStore.getState().zoom).toBe(0.1);
    
    // 测试 Infinity
    store.setZoom(Infinity);
    expect(useCanvasStore.getState().zoom).toBe(2.0);
    
    // 测试 -Infinity
    store.setZoom(-Infinity);
    expect(useCanvasStore.getState().zoom).toBe(0.1);
  });
});

/**
 * Feature: drag-builder, Property 2: 组件创建完整性
 * 
 * 对于任何从物料库拖拽到画布的操作，系统应该：
 * 1. 创建一个新的组件节点
 * 2. 将组件放置在鼠标释放位置
 * 3. 应用该组件类型的默认样式
 * 4. 分配一个唯一的 UUID（不与现有组件重复）
 * 5. 自动选中新创建的组件
 * 
 * 验证需求：3.4, 3.5, 3.6, 3.7, 3.8
 */
describe('Property 2: 组件创建完整性', () => {
  beforeEach(() => {
    // 重置 store 状态
    resetComponentStore();
  });

  afterEach(() => {
    // 测试后清理状态
    resetComponentStore();
  });

  /**
   * 生成随机拖拽位置
   */
  const generateDropPosition = () => {
    return fc.record({
      x: fc.integer({ min: 0, max: 5000 }),
      y: fc.integer({ min: 0, max: 5000 }),
    });
  };

  /**
   * 验证 UUID v4 格式
   */
  const isValidUUIDv4 = (uuid: string): boolean => {
    const uuidv4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidv4Regex.test(uuid);
  };

  /**
   * 验证组件是否具有默认样式
   */
  const hasDefaultStyles = (component: ComponentNode): boolean => {
    // 检查是否有样式对象
    if (!component.styles) return false;
    
    // 根据组件类型验证默认样式
    switch (component.type) {
      case 'div':
        return (
          component.position.width === 200 &&
          component.position.height === 100 &&
          component.styles.borderColor === '#E2E8F0' &&
          component.styles.borderWidth === 1 &&
          component.styles.borderRadius === 16
        );
      case 'button':
        return (
          component.position.width === 120 &&
          component.position.height === 40 &&
          component.styles.backgroundColor === '#C2410C' &&
          component.styles.textColor === '#FFFFFF' &&
          component.styles.borderRadius === 8
        );
      case 'text':
        return (
          component.styles.textColor === '#0F172A' &&
          component.styles.fontSize === 16 &&
          component.content.text === '文本内容'
        );
      case 'image':
        return (
          component.position.width === 200 &&
          component.position.height === 200 &&
          component.styles.backgroundColor === '#F1F5F9'
        );
      case 'input':
        return (
          component.position.width === 240 &&
          component.position.height === 40 &&
          component.styles.borderColor === '#E2E8F0' &&
          component.styles.borderWidth === 1 &&
          component.content.placeholder === '请输入内容'
        );
      default:
        return false;
    }
  };

  it('对于任何组件类型和位置，应该创建完整的组件', async () => {
    // 动态导入 createDefaultComponent 函数
    const { createDefaultComponent } = await import('../src/components/MaterialPanel/materialConfig');
    
    fc.assert(
      fc.property(
        fc.constantFrom('div', 'button', 'text', 'image', 'input'),
        generateDropPosition(),
        (componentType, dropPosition) => {
          // 在每次迭代前清空状态
          resetComponentStore();
          
          // 模拟拖拽创建组件
          const newComponent = createDefaultComponent(componentType, dropPosition);
          const componentId = newComponent.id;
          
          // 重新获取 store 引用并添加组件
          useComponentStore.getState().addComponent(newComponent);
          
          // 获取添加后的组件
          const addedComponent = useComponentStore.getState().getComponentById(componentId);
          
          // 验证 1: 组件已创建
          expect(addedComponent).toBeDefined();
          
          if (addedComponent) {
            // 验证 2: 组件位置正确
            expect(addedComponent.position.x).toBe(dropPosition.x);
            expect(addedComponent.position.y).toBe(dropPosition.y);
            
            // 验证 3: 应用了默认样式
            expect(hasDefaultStyles(addedComponent)).toBe(true);
            
            // 验证 4: 分配了唯一的 UUID v4
            expect(isValidUUIDv4(addedComponent.id)).toBe(true);
            
            // 验证 5: 自动选中新创建的组件
            expect(useComponentStore.getState().selectedId).toBe(componentId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多个组件，每个组件的 ID 应该是唯一的', async () => {
    // 动态导入 createDefaultComponent 函数
    const { createDefaultComponent } = await import('../src/components/MaterialPanel/materialConfig');
    
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('div', 'button', 'text', 'image', 'input'),
            position: generateDropPosition(),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (componentsData) => {
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 创建多个组件
          const createdIds: string[] = [];
          componentsData.forEach(data => {
            const component = createDefaultComponent(data.type, data.position);
            store.addComponent(component);
            createdIds.push(component.id);
          });
          
          // 验证所有 ID 都是唯一的
          const uniqueIds = new Set(createdIds);
          expect(uniqueIds.size).toBe(createdIds.length);
          
          // 验证所有 ID 都是有效的 UUID v4
          createdIds.forEach(id => {
            expect(isValidUUIDv4(id)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于每种组件类型，应该应用正确的默认样式', async () => {
    // 动态导入 createDefaultComponent 函数
    const { createDefaultComponent } = await import('../src/components/MaterialPanel/materialConfig');
    
    const componentTypes = ['div', 'button', 'text', 'image', 'input'] as const;
    
    componentTypes.forEach(type => {
      resetComponentStore();
      const store = useComponentStore.getState();
      
      const component = createDefaultComponent(type, { x: 100, y: 100 });
      store.addComponent(component);
      
      const addedComponent = store.getComponentById(component.id);
      expect(addedComponent).toBeDefined();
      
      if (addedComponent) {
        expect(hasDefaultStyles(addedComponent)).toBe(true);
        expect(addedComponent.type).toBe(type);
      }
    });
  });

  it('对于新创建的组件，应该自动选中', async () => {
    // 动态导入 createDefaultComponent 函数
    const { createDefaultComponent } = await import('../src/components/MaterialPanel/materialConfig');
    
    fc.assert(
      fc.property(
        fc.constantFrom('div', 'button', 'text', 'image', 'input'),
        generateDropPosition(),
        (componentType, dropPosition) => {
          // 在每次迭代前清空状态
          resetComponentStore();
          
          // 创建组件
          const component = createDefaultComponent(componentType, dropPosition);
          const componentId = component.id;
          useComponentStore.getState().addComponent(component);
          
          // 验证自动选中
          expect(useComponentStore.getState().selectedId).toBe(componentId);
          
          // 验证 getSelectedComponent 返回正确的组件
          const selectedComponent = useComponentStore.getState().getSelectedComponent();
          expect(selectedComponent).toBeDefined();
          expect(selectedComponent?.id).toBe(componentId);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: drag-builder, Property 3: 组件选中状态一致性
 * 
 * 对于任何被选中的组件，系统应该同时满足：
 * 1. 显示蓝色选中边框（2px solid #3B82F6）- UI 层面，这里验证状态
 * 2. 显示 8 个调整手柄（四角 + 四边中点）- UI 层面，这里验证状态
 * 3. 在属性面板中显示该组件的所有属性 - UI 层面，这里验证状态
 * 4. 将 selectedId 状态设置为该组件的 ID
 * 
 * 验证需求：4.1, 4.2, 4.3, 4.7
 */
describe('Property 3: 组件选中状态一致性', () => {
  beforeEach(() => {
    // 重置 store 状态
    resetComponentStore();
  });

  afterEach(() => {
    // 测试后清理状态
    resetComponentStore();
  });

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

  it('对于任何选中的组件，selectedId 应该正确设置', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        (component) => {
          // 在每次迭代前清空状态
          resetComponentStore();
          
          // 添加组件（会自动选中）
          const componentId = component.id;
          useComponentStore.getState().addComponent(component);
          
          // 验证 selectedId 正确设置（addComponent 会自动选中）
          expect(useComponentStore.getState().selectedId).toBe(componentId);
          
          // 取消选中
          useComponentStore.getState().selectComponent(null);
          expect(useComponentStore.getState().selectedId).toBeNull();
          
          // 再次选中
          useComponentStore.getState().selectComponent(componentId);
          expect(useComponentStore.getState().selectedId).toBe(componentId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于任何选中的组件，getSelectedComponent 应该返回正确的组件', () => {
    fc.assert(
      fc.property(
        fc.array(generateComponent(), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (components, selectIndex) => {
          // 在每次迭代前清空状态
          resetComponentStore();
          const store = useComponentStore.getState();
          
          // 添加所有组件（最后一个会被自动选中）
          components.forEach(comp => store.addComponent(comp));
          
          // 选中指定索引的组件
          const targetIndex = selectIndex % components.length;
          const targetComponent = components[targetIndex];
          const targetId = targetComponent.id;
          store.selectComponent(targetId);
          
          // 验证 getSelectedComponent 返回正确的组件
          const selectedComponent = store.getSelectedComponent();
          expect(selectedComponent).toBeDefined();
          expect(selectedComponent?.id).toBe(targetId);
          expect(selectedComponent?.type).toBe(targetComponent.type);
          expect(selectedComponent?.position).toEqual(targetComponent.position);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于取消选中操作，selectedId 应该为 null', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        (component) => {
          // 在每次迭代前清空状态
          resetComponentStore();
          
          // 添加组件（会自动选中）
          const componentId = component.id;
          useComponentStore.getState().addComponent(component);
          expect(useComponentStore.getState().selectedId).toBe(componentId);
          
          // 取消选中
          useComponentStore.getState().selectComponent(null);
          
          // 验证 selectedId 为 null
          expect(useComponentStore.getState().selectedId).toBeNull();
          
          // 验证 getSelectedComponent 返回 undefined
          expect(useComponentStore.getState().getSelectedComponent()).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多次选中不同组件，selectedId 应该始终指向最后选中的组件', () => {
    fc.assert(
      fc.property(
        fc.array(generateComponent(), { minLength: 2, maxLength: 10 }),
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 1, maxLength: 20 }),
        (components, selectSequence) => {
          // 在每次迭代前清空状态
          resetComponentStore();
          
          // 添加所有组件（最后一个会被自动选中）
          components.forEach(comp => useComponentStore.getState().addComponent(comp));
          
          // 执行一系列选中操作
          let lastSelectedId: string | null = null;
          selectSequence.forEach(index => {
            const targetIndex = index % components.length;
            const targetId = components[targetIndex].id;
            useComponentStore.getState().selectComponent(targetId);
            lastSelectedId = targetId;
          });
          
          // 验证 selectedId 指向最后选中的组件
          expect(useComponentStore.getState().selectedId).toBe(lastSelectedId);
          
          // 验证 getSelectedComponent 返回最后选中的组件
          const selectedComponent = useComponentStore.getState().getSelectedComponent();
          expect(selectedComponent?.id).toBe(lastSelectedId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于删除选中的组件，selectedId 应该被清除', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        (component) => {
          // 在每次迭代前清空状态
          resetComponentStore();
          
          // 添加组件（会自动选中）
          const componentId = component.id;
          useComponentStore.getState().addComponent(component);
          expect(useComponentStore.getState().selectedId).toBe(componentId);
          
          // 删除选中的组件
          useComponentStore.getState().deleteComponent(componentId);
          
          // 验证 selectedId 被清除
          expect(useComponentStore.getState().selectedId).toBeNull();
          
          // 验证组件已被删除
          expect(useComponentStore.getState().getComponentById(componentId)).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于选中不存在的组件 ID，selectedId 应该被设置但 getSelectedComponent 返回 undefined', () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        (nonExistentId) => {
          // 在每次迭代前清空状态
          resetComponentStore();
          
          // 选中不存在的组件
          useComponentStore.getState().selectComponent(nonExistentId);
          
          // 验证 selectedId 被设置
          expect(useComponentStore.getState().selectedId).toBe(nonExistentId);
          
          // 验证 getSelectedComponent 返回 undefined
          expect(useComponentStore.getState().getSelectedComponent()).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于选中状态，应该在组件更新后保持一致', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        fc.record({
          x: fc.integer({ min: 0, max: 5000 }),
          y: fc.integer({ min: 0, max: 5000 }),
        }),
        (component, newPosition) => {
          // 在每次迭代前清空状态
          resetComponentStore();
          
          // 添加组件（会自动选中）
          const componentId = component.id;
          useComponentStore.getState().addComponent(component);
          expect(useComponentStore.getState().selectedId).toBe(componentId);
          
          // 更新组件位置
          useComponentStore.getState().updateComponent(componentId, {
            position: {
              ...component.position,
              x: newPosition.x,
              y: newPosition.y,
            },
          });
          
          // 验证选中状态保持不变
          expect(useComponentStore.getState().selectedId).toBe(componentId);
          
          // 验证 getSelectedComponent 返回更新后的组件
          const selectedComponent = useComponentStore.getState().getSelectedComponent();
          expect(selectedComponent?.id).toBe(componentId);
          expect(selectedComponent?.position.x).toBe(newPosition.x);
          expect(selectedComponent?.position.y).toBe(newPosition.y);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: drag-builder, Property 16: zIndex 非负不变量
 * 
 * 对于任何组件，在任何时刻，其 zIndex 值应该是非负整数（>= 0）
 * 
 * 验证需求：8.6
 */
describe('Property 16: zIndex 非负不变量', () => {
  beforeEach(() => {
    // 重置 store 状态
    useComponentStore.getState().clearAll();
  });

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
        zIndex: fc.integer({ min: -100, max: 1000 }), // 允许负数输入来测试边界
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

  it('对于任何新添加的组件，zIndex 应该是非负整数', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        (component) => {
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          
          // 获取添加后的组件
          const addedComponent = store.getComponentById(component.id);
          
          // 验证 zIndex 非负不变量
          expect(addedComponent).toBeDefined();
          if (addedComponent) {
            expect(addedComponent.position.zIndex).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(addedComponent.position.zIndex)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于下移一层操作，zIndex 应该保持非负', () => {
    fc.assert(
      fc.property(
        fc.array(generateComponent(), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 20 }), // 下移次数
        (components, moveDownTimes) => {
          const store = useComponentStore.getState();
          
          // 清空并添加组件
          store.clearAll();
          components.forEach(comp => store.addComponent(comp));
          
          // 选择第一个组件并多次下移
          const firstComponent = components[0];
          for (let i = 0; i < moveDownTimes; i++) {
            store.moveDown(firstComponent.id);
          }
          
          // 验证 zIndex 非负不变量
          const updatedComponent = store.getComponentById(firstComponent.id);
          expect(updatedComponent).toBeDefined();
          if (updatedComponent) {
            expect(updatedComponent.position.zIndex).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(updatedComponent.position.zIndex)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于置于底层操作，zIndex 应该是 0', () => {
    fc.assert(
      fc.property(
        generateComponent(),
        (component) => {
          const store = useComponentStore.getState();
          
          // 添加组件
          store.addComponent(component);
          
          // 置于底层
          store.sendToBack(component.id);
          
          // 验证 zIndex 为 0
          const updatedComponent = store.getComponentById(component.id);
          expect(updatedComponent).toBeDefined();
          if (updatedComponent) {
            expect(updatedComponent.position.zIndex).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于所有层级操作，所有组件的 zIndex 应该始终非负', () => {
    fc.assert(
      fc.property(
        fc.array(generateComponent(), { minLength: 2, maxLength: 5 }),
        fc.array(
          fc.record({
            componentIndex: fc.integer({ min: 0, max: 4 }),
            operation: fc.constantFrom('bringToFront', 'sendToBack', 'moveUp', 'moveDown'),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (components, operations) => {
          const store = useComponentStore.getState();
          
          // 清空并添加组件
          store.clearAll();
          components.forEach(comp => store.addComponent(comp));
          
          // 执行一系列随机操作
          operations.forEach(op => {
            const componentIndex = op.componentIndex % components.length;
            const componentId = components[componentIndex].id;
            
            switch (op.operation) {
              case 'bringToFront':
                store.bringToFront(componentId);
                break;
              case 'sendToBack':
                store.sendToBack(componentId);
                break;
              case 'moveUp':
                store.moveUp(componentId);
                break;
              case 'moveDown':
                store.moveDown(componentId);
                break;
            }
          });
          
          // 验证所有组件的 zIndex 都是非负整数
          const allComponents = useComponentStore.getState().components;
          allComponents.forEach(comp => {
            expect(comp.position.zIndex).toBeGreaterThanOrEqual(0);
            expect(Number.isInteger(comp.position.zIndex)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于边界情况，zIndex 应该正确处理', () => {
    const store = useComponentStore.getState();
    
    // 创建一个 zIndex 为 0 的组件
    const component: ComponentNode = {
      id: 'test-1',
      type: 'div',
      position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
      styles: {},
      content: {},
    };
    
    store.addComponent(component);
    
    // 尝试下移（应该保持为 0）
    store.moveDown('test-1');
    expect(store.getComponentById('test-1')?.position.zIndex).toBe(0);
    
    // 再次下移（应该仍然保持为 0）
    store.moveDown('test-1');
    expect(store.getComponentById('test-1')?.position.zIndex).toBe(0);
    
    // 上移（应该变为 1）
    store.moveUp('test-1');
    expect(store.getComponentById('test-1')?.position.zIndex).toBe(1);
    
    // 置于底层（应该变为 0）
    store.sendToBack('test-1');
    expect(store.getComponentById('test-1')?.position.zIndex).toBe(0);
  });
});

/**
 * Feature: drag-builder, Property 17: 吸附系统完整性
 * 
 * 对于任何拖拽操作,当组件边缘与其他组件边缘的距离小于 5px 时,系统应该:
 * 1. 检测对齐关系(左/右/顶/底/水平居中/垂直居中)
 * 2. 显示粉色辅助线(1px solid #EC4899) - UI 层面,这里验证辅助线数据
 * 3. 自动吸附组件到对齐位置(误差 ±2px)
 * 
 * 验证需求: 6.1, 6.2, 6.4
 */
describe('Property 17: 吸附系统完整性', () => {
  /**
   * 生成随机组件节点
   */
  const generateComponent = (overrides?: Partial<ComponentNode>): ComponentNode => {
    return {
      id: overrides?.id || `comp-${Math.random().toString(36).substr(2, 9)}`,
      type: overrides?.type || 'div',
      position: {
        x: overrides?.position?.x ?? 100,
        y: overrides?.position?.y ?? 100,
        width: overrides?.position?.width ?? 200,
        height: overrides?.position?.height ?? 100,
        zIndex: overrides?.position?.zIndex ?? 0,
      },
      styles: overrides?.styles || {},
      content: overrides?.content || {},
    };
  };

  /**
   * 生成在吸附阈值内的组件对
   * 返回两个组件,它们的边缘距离在吸附阈值(5px)内
   */
  const generateSnappableComponents = () => {
    return fc.record({
      // 基准组件的位置
      baseX: fc.integer({ min: 100, max: 1000 }),
      baseY: fc.integer({ min: 100, max: 1000 }),
      baseWidth: fc.integer({ min: 50, max: 300 }),
      baseHeight: fc.integer({ min: 50, max: 300 }),
      
      // 对齐类型
      alignmentType: fc.constantFrom(
        'left',           // 左对齐
        'right',          // 右对齐
        'top',            // 顶部对齐
        'bottom',         // 底部对齐
        'centerX',        // 水平居中对齐
        'centerY'         // 垂直居中对齐
      ),
      
      // 距离偏移(在阈值内: 0-4px)
      offset: fc.integer({ min: 0, max: 4 }),
      
      // 移动组件的尺寸
      movingWidth: fc.integer({ min: 50, max: 300 }),
      movingHeight: fc.integer({ min: 50, max: 300 }),
    });
  };

  /**
   * 根据对齐类型计算移动组件的位置
   */
  const calculateMovingPosition = (
    baseX: number,
    baseY: number,
    baseWidth: number,
    baseHeight: number,
    movingWidth: number,
    movingHeight: number,
    alignmentType: string,
    offset: number
  ): { x: number; y: number } => {
    switch (alignmentType) {
      case 'left':
        // 左对齐: 移动组件的左边界接近基准组件的左边界
        return { x: baseX + offset, y: baseY + 50 };
      
      case 'right':
        // 右对齐: 移动组件的右边界接近基准组件的右边界
        return { x: baseX + baseWidth - movingWidth + offset, y: baseY + 50 };
      
      case 'top':
        // 顶部对齐: 移动组件的上边界接近基准组件的上边界
        return { x: baseX + 50, y: baseY + offset };
      
      case 'bottom':
        // 底部对齐: 移动组件的下边界接近基准组件的下边界
        return { x: baseX + 50, y: baseY + baseHeight - movingHeight + offset };
      
      case 'centerX': {
        // 水平居中对齐: 移动组件的水平中心接近基准组件的水平中心
        const baseCenterX = baseX + baseWidth / 2;
        return { x: baseCenterX - movingWidth / 2 + offset, y: baseY + 50 };
      }
      
      case 'centerY': {
        // 垂直居中对齐: 移动组件的垂直中心接近基准组件的垂直中心
        const baseCenterY = baseY + baseHeight / 2;
        return { x: baseX + 50, y: baseCenterY - movingHeight / 2 + offset };
      }
      default:
        return { x: baseX, y: baseY };
    }
  };

  it('对于任何在吸附阈值内的组件对,应该检测到对齐关系', async () => {
    // 动态导入 SnappingEngine
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        generateSnappableComponents(),
        (data) => {
          const engine = new SnappingEngine();
          
          // 创建基准组件
          const baseComponent = generateComponent({
            id: 'base',
            position: {
              x: data.baseX,
              y: data.baseY,
              width: data.baseWidth,
              height: data.baseHeight,
              zIndex: 0,
            },
          });
          
          // 计算移动组件的位置(在吸附阈值内)
          const movingPos = calculateMovingPosition(
            data.baseX,
            data.baseY,
            data.baseWidth,
            data.baseHeight,
            data.movingWidth,
            data.movingHeight,
            data.alignmentType,
            data.offset
          );
          
          // 创建移动组件
          const movingComponent = generateComponent({
            id: 'moving',
            position: {
              x: movingPos.x,
              y: movingPos.y,
              width: data.movingWidth,
              height: data.movingHeight,
              zIndex: 1,
            },
          });
          
          // 检测吸附
          const result = engine.detectSnapping(movingComponent, [baseComponent]);
          
          // 验证 1: 应该检测到对齐关系(至少有一条辅助线)
          expect(result.snapLines.length).toBeGreaterThan(0);
          
          // 验证 2: 应该提供吸附位置(snapX 或 snapY 至少有一个不为 null)
          const hasSnapPosition = result.snapX !== null || result.snapY !== null;
          expect(hasSnapPosition).toBe(true);
          
          // 验证 3: 辅助线类型应该正确
          result.snapLines.forEach(line => {
            expect(['horizontal', 'vertical']).toContain(line.type);
            expect(typeof line.position).toBe('number');
            expect(typeof line.refStart).toBe('number');
            expect(typeof line.refEnd).toBe('number');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于左对齐,应该返回正确的吸附位置和辅助线', async () => {
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 0, max: 4 }),
        (baseX, baseY, baseWidth, baseHeight, offset) => {
          const engine = new SnappingEngine();
          
          // 基准组件
          const baseComponent = generateComponent({
            id: 'base',
            position: { x: baseX, y: baseY, width: baseWidth, height: baseHeight, zIndex: 0 },
          });
          
          // 移动组件(左边界接近基准组件左边界)
          const movingComponent = generateComponent({
            id: 'moving',
            position: { x: baseX + offset, y: baseY + 50, width: 100, height: 100, zIndex: 1 },
          });
          
          const result = engine.detectSnapping(movingComponent, [baseComponent]);
          
          // 验证吸附位置(应该吸附到基准组件的左边界)
          expect(result.snapX).toBe(baseX);
          
          // 验证辅助线
          expect(result.snapLines.length).toBeGreaterThan(0);
          const verticalLine = result.snapLines.find(line => line.type === 'vertical');
          expect(verticalLine).toBeDefined();
          if (verticalLine) {
            expect(verticalLine.position).toBe(baseX);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于右对齐,应该返回正确的吸附位置和辅助线', async () => {
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 50, max: 80 }), // 移动组件宽度明显小于基准组件
        fc.integer({ min: 0, max: 4 }),
        (baseX, baseY, baseWidth, baseHeight, movingWidth, offset) => {
          const engine = new SnappingEngine();
          
          // 基准组件
          const baseComponent = generateComponent({
            id: 'base',
            position: { x: baseX, y: baseY, width: baseWidth, height: baseHeight, zIndex: 0 },
          });
          
          // 移动组件(右边界接近基准组件右边界,左边界远离)
          // 确保左边界距离 > 阈值
          const movingX = baseX + baseWidth - movingWidth + offset;
          const movingComponent = generateComponent({
            id: 'moving',
            position: { x: movingX, y: baseY + 50, width: movingWidth, height: 100, zIndex: 1 },
          });
          
          const result = engine.detectSnapping(movingComponent, [baseComponent]);
          
          // 验证吸附位置(应该吸附到基准组件的右边界 - 移动组件宽度)
          const expectedSnapX = baseX + baseWidth - movingWidth;
          expect(result.snapX).toBe(expectedSnapX);
          
          // 验证辅助线
          const verticalLine = result.snapLines.find(line => line.type === 'vertical');
          expect(verticalLine).toBeDefined();
          if (verticalLine) {
            expect(verticalLine.position).toBe(baseX + baseWidth);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于顶部对齐,应该返回正确的吸附位置和辅助线', async () => {
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 0, max: 4 }),
        (baseX, baseY, baseWidth, baseHeight, offset) => {
          const engine = new SnappingEngine();
          
          // 基准组件
          const baseComponent = generateComponent({
            id: 'base',
            position: { x: baseX, y: baseY, width: baseWidth, height: baseHeight, zIndex: 0 },
          });
          
          // 移动组件(上边界接近基准组件上边界)
          const movingComponent = generateComponent({
            id: 'moving',
            position: { x: baseX + 50, y: baseY + offset, width: 100, height: 100, zIndex: 1 },
          });
          
          const result = engine.detectSnapping(movingComponent, [baseComponent]);
          
          // 验证吸附位置(应该吸附到基准组件的上边界)
          expect(result.snapY).toBe(baseY);
          
          // 验证辅助线
          const horizontalLine = result.snapLines.find(line => line.type === 'horizontal');
          expect(horizontalLine).toBeDefined();
          if (horizontalLine) {
            expect(horizontalLine.position).toBe(baseY);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于底部对齐,应该返回正确的吸附位置和辅助线', async () => {
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 50, max: 80 }), // 移动组件高度明显小于基准组件
        fc.integer({ min: 0, max: 4 }),
        (baseX, baseY, baseWidth, baseHeight, movingHeight, offset) => {
          const engine = new SnappingEngine();
          
          // 基准组件
          const baseComponent = generateComponent({
            id: 'base',
            position: { x: baseX, y: baseY, width: baseWidth, height: baseHeight, zIndex: 0 },
          });
          
          // 移动组件(下边界接近基准组件下边界,上边界远离)
          const movingY = baseY + baseHeight - movingHeight + offset;
          const movingComponent = generateComponent({
            id: 'moving',
            position: { x: baseX + 50, y: movingY, width: 100, height: movingHeight, zIndex: 1 },
          });
          
          const result = engine.detectSnapping(movingComponent, [baseComponent]);
          
          // 验证吸附位置(应该吸附到基准组件的下边界 - 移动组件高度)
          const expectedSnapY = baseY + baseHeight - movingHeight;
          expect(result.snapY).toBe(expectedSnapY);
          
          // 验证辅助线
          const horizontalLine = result.snapLines.find(line => line.type === 'horizontal');
          expect(horizontalLine).toBeDefined();
          if (horizontalLine) {
            expect(horizontalLine.position).toBe(baseY + baseHeight);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于水平居中对齐,应该返回正确的吸附位置和辅助线', async () => {
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 50, max: 80 }), // 移动组件宽度明显小于基准组件
        fc.integer({ min: 0, max: 4 }),
        (baseX, baseY, baseWidth, baseHeight, movingWidth, offset) => {
          const engine = new SnappingEngine();
          
          // 基准组件
          const baseComponent = generateComponent({
            id: 'base',
            position: { x: baseX, y: baseY, width: baseWidth, height: baseHeight, zIndex: 0 },
          });
          
          // 移动组件(水平中心接近基准组件水平中心)
          const baseCenterX = baseX + baseWidth / 2;
          const movingX = baseCenterX - movingWidth / 2 + offset;
          const movingComponent = generateComponent({
            id: 'moving',
            position: { x: movingX, y: baseY + 50, width: movingWidth, height: 100, zIndex: 1 },
          });
          
          const result = engine.detectSnapping(movingComponent, [baseComponent]);
          
          // 验证吸附位置(应该吸附到基准组件的水平中心 - 移动组件宽度/2)
          const expectedSnapX = baseCenterX - movingWidth / 2;
          expect(result.snapX).toBe(expectedSnapX);
          
          // 验证辅助线
          const verticalLine = result.snapLines.find(line => line.type === 'vertical');
          expect(verticalLine).toBeDefined();
          if (verticalLine) {
            expect(verticalLine.position).toBe(baseCenterX);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于垂直居中对齐,应该返回正确的吸附位置和辅助线', async () => {
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 100, max: 300 }),
        fc.integer({ min: 50, max: 80 }), // 移动组件高度明显小于基准组件
        fc.integer({ min: 0, max: 4 }),
        (baseX, baseY, baseWidth, baseHeight, movingHeight, offset) => {
          const engine = new SnappingEngine();
          
          // 基准组件
          const baseComponent = generateComponent({
            id: 'base',
            position: { x: baseX, y: baseY, width: baseWidth, height: baseHeight, zIndex: 0 },
          });
          
          // 移动组件(垂直中心接近基准组件垂直中心)
          const baseCenterY = baseY + baseHeight / 2;
          const movingY = baseCenterY - movingHeight / 2 + offset;
          const movingComponent = generateComponent({
            id: 'moving',
            position: { x: baseX + 50, y: movingY, width: 100, height: movingHeight, zIndex: 1 },
          });
          
          const result = engine.detectSnapping(movingComponent, [baseComponent]);
          
          // 验证吸附位置(应该吸附到基准组件的垂直中心 - 移动组件高度/2)
          const expectedSnapY = baseCenterY - movingHeight / 2;
          expect(result.snapY).toBe(expectedSnapY);
          
          // 验证辅助线
          const horizontalLine = result.snapLines.find(line => line.type === 'horizontal');
          expect(horizontalLine).toBeDefined();
          if (horizontalLine) {
            expect(horizontalLine.position).toBe(baseCenterY);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于超出吸附阈值的组件,不应该检测到对齐关系', async () => {
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 50, max: 100 }), // 基准组件尺寸
        fc.integer({ min: 50, max: 100 }),
        (baseX, baseY, baseWidth, baseHeight) => {
          const engine = new SnappingEngine();
          
          // 基准组件
          const baseComponent = generateComponent({
            id: 'base',
            position: { x: baseX, y: baseY, width: baseWidth, height: baseHeight, zIndex: 0 },
          });
          
          // 移动组件位置在基准组件右下方,距离明显超出阈值
          // 确保所有边界(左/右/上/下/中心)都超出阈值
          const movingX = baseX + baseWidth + 10; // 左边界距离基准右边界 10px
          const movingY = baseY + baseHeight + 10; // 上边界距离基准下边界 10px
          const movingComponent = generateComponent({
            id: 'moving',
            position: { x: movingX, y: movingY, width: 50, height: 50, zIndex: 1 },
          });
          
          const result = engine.detectSnapping(movingComponent, [baseComponent]);
          
          // 验证不应该检测到对齐关系
          expect(result.snapLines.length).toBe(0);
          expect(result.snapX).toBeNull();
          expect(result.snapY).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于多个组件,应该检测到所有可能的对齐关系', async () => {
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 500 }),
        fc.integer({ min: 100, max: 500 }),
        fc.integer({ min: 2, max: 5 }),
        (baseX, baseY, componentCount) => {
          const engine = new SnappingEngine();
          
          // 创建多个基准组件,它们的左边界对齐
          const baseComponents: ComponentNode[] = [];
          for (let i = 0; i < componentCount; i++) {
            baseComponents.push(
              generateComponent({
                id: `base-${i}`,
                position: {
                  x: baseX,
                  y: baseY + i * 150,
                  width: 100,
                  height: 100,
                  zIndex: i,
                },
              })
            );
          }
          
          // 创建移动组件,其左边界接近所有基准组件的左边界
          const movingComponent = generateComponent({
            id: 'moving',
            position: {
              x: baseX + 2, // 在吸附阈值内
              y: baseY + 50,
              width: 100,
              height: 100,
              zIndex: componentCount,
            },
          });
          
          const result = engine.detectSnapping(movingComponent, baseComponents);
          
          // 验证应该检测到对齐关系
          expect(result.snapLines.length).toBeGreaterThan(0);
          expect(result.snapX).toBe(baseX);
          
          // 验证辅助线数量(可能有多条,因为有多个组件对齐)
          const verticalLines = result.snapLines.filter(line => line.type === 'vertical');
          expect(verticalLines.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于吸附位置,误差应该在 ±2px 范围内', async () => {
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 0, max: 4 }),
        (baseX, baseY, baseWidth, baseHeight, offset) => {
          const engine = new SnappingEngine();
          
          // 基准组件
          const baseComponent = generateComponent({
            id: 'base',
            position: { x: baseX, y: baseY, width: baseWidth, height: baseHeight, zIndex: 0 },
          });
          
          // 移动组件(左边界接近基准组件左边界)
          const movingComponent = generateComponent({
            id: 'moving',
            position: { x: baseX + offset, y: baseY + 50, width: 100, height: 100, zIndex: 1 },
          });
          
          const result = engine.detectSnapping(movingComponent, [baseComponent]);
          
          // 验证吸附位置的误差在 ±2px 范围内
          if (result.snapX !== null) {
            const error = Math.abs(result.snapX - baseX);
            expect(error).toBeLessThanOrEqual(2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于同时满足水平和垂直对齐的情况,应该同时返回两个方向的吸附位置', async () => {
    const { SnappingEngine } = await import('../src/utils/snapping');
    
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 100, max: 1000 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 50, max: 300 }),
        fc.integer({ min: 0, max: 4 }),
        fc.integer({ min: 0, max: 4 }),
        (baseX, baseY, baseWidth, baseHeight, offsetX, offsetY) => {
          const engine = new SnappingEngine();
          
          // 基准组件
          const baseComponent = generateComponent({
            id: 'base',
            position: { x: baseX, y: baseY, width: baseWidth, height: baseHeight, zIndex: 0 },
          });
          
          // 移动组件(左边界和上边界都接近基准组件)
          const movingComponent = generateComponent({
            id: 'moving',
            position: { x: baseX + offsetX, y: baseY + offsetY, width: 100, height: 100, zIndex: 1 },
          });
          
          const result = engine.detectSnapping(movingComponent, [baseComponent]);
          
          // 验证应该同时返回 X 和 Y 方向的吸附位置
          expect(result.snapX).toBe(baseX);
          expect(result.snapY).toBe(baseY);
          
          // 验证应该有两条辅助线(一条水平,一条垂直)
          expect(result.snapLines.length).toBe(2);
          const hasHorizontal = result.snapLines.some(line => line.type === 'horizontal');
          const hasVertical = result.snapLines.some(line => line.type === 'vertical');
          expect(hasHorizontal).toBe(true);
          expect(hasVertical).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
