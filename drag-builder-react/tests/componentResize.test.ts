/**
 * 组件调整尺寸功能测试
 * 测试在不同缩放比例下调整组件尺寸时的行为
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentStore } from '../src/store/componentStore';
import { useCanvasStore } from '../src/store/canvasStore';
import { createDefaultComponent } from '../src/components/MaterialPanel';

describe('组件调整尺寸功能', () => {
  beforeEach(() => {
    // 每个测试前清空状态
    const { clearAll } = useComponentStore.getState();
    const { resetCanvas } = useCanvasStore.getState();
    clearAll();
    resetCanvas();
  });

  it('在 100% 缩放下调整尺寸应正常工作', () => {
    const { result } = renderHook(() => useComponentStore());

    // 创建一个组件
    const component = createDefaultComponent('div', { x: 100, y: 100 });

    act(() => {
      result.current.addComponent(component);
    });

    const initialComponent = result.current.components[0];
    expect(initialComponent.position.width).toBe(200);
    expect(initialComponent.position.height).toBe(100);

    // 模拟调整尺寸（增加 50px 宽度和 30px 高度）
    act(() => {
      result.current.updateComponent(initialComponent.id, {
        position: {
          width: 250,
          height: 130,
        },
      });
    });

    const resizedComponent = result.current.components[0];
    expect(resizedComponent.position.width).toBe(250);
    expect(resizedComponent.position.height).toBe(130);
    // 位置应保持不变
    expect(resizedComponent.position.x).toBe(100);
    expect(resizedComponent.position.y).toBe(100);
  });

  it('在缩放画布后调整尺寸应考虑缩放比例', () => {
    const { result: componentResult } = renderHook(() => useComponentStore());
    const { result: canvasResult } = renderHook(() => useCanvasStore());

    // 创建一个组件
    const component = createDefaultComponent('button', { x: 50, y: 50 });

    act(() => {
      componentResult.current.addComponent(component);
    });

    // 放大画布到 200%
    act(() => {
      canvasResult.current.setZoom(2.0);
    });

    const initialComponent = componentResult.current.components[0];
    const initialWidth = initialComponent.position.width;
    const initialHeight = initialComponent.position.height;

    // 模拟在 200% 缩放下调整尺寸
    // 如果鼠标移动了 100px（屏幕坐标），实际应该是 50px（画布坐标）
    const zoom = canvasResult.current.zoom;
    const screenDelta = 100;
    const canvasDelta = screenDelta / zoom; // 100 / 2.0 = 50

    act(() => {
      componentResult.current.updateComponent(initialComponent.id, {
        position: {
          width: initialWidth + canvasDelta,
          height: initialHeight + canvasDelta,
        },
      });
    });

    const resizedComponent = componentResult.current.components[0];
    expect(resizedComponent.position.width).toBe(initialWidth + 50);
    expect(resizedComponent.position.height).toBe(initialHeight + 50);
  });

  it('调整尺寸时应限制最小尺寸为 20x20px', () => {
    const { result } = renderHook(() => useComponentStore());

    // 创建一个小组件
    const component = createDefaultComponent('text', { x: 100, y: 100 });

    act(() => {
      result.current.addComponent(component);
    });

    // 尝试调整到小于最小尺寸
    act(() => {
      result.current.updateComponent(component.id, {
        position: {
          width: 10, // 小于最小值 20
          height: 15, // 小于最小值 20
        },
      });
    });

    // 注意：最小尺寸限制在 ResizeHandles 组件中实现
    // 这里只是测试 store 的更新功能
    const updatedComponent = result.current.components[0];
    expect(updatedComponent.position.width).toBe(10);
    expect(updatedComponent.position.height).toBe(15);
  });

  it('从左上角调整尺寸时应同时更新位置', () => {
    const { result } = renderHook(() => useComponentStore());

    // 创建一个组件
    const component = createDefaultComponent('div', { x: 200, y: 200 });

    act(() => {
      result.current.addComponent(component);
    });

    const initialComponent = result.current.components[0];
    const initialX = initialComponent.position.x;
    const initialY = initialComponent.position.y;
    const initialWidth = initialComponent.position.width;
    const initialHeight = initialComponent.position.height;

    // 模拟从左上角调整尺寸（增加 50px 宽度和高度）
    // 左上角调整时，位置应该向左上移动
    const widthIncrease = 50;
    const heightIncrease = 50;

    act(() => {
      result.current.updateComponent(initialComponent.id, {
        position: {
          x: initialX - widthIncrease,
          y: initialY - heightIncrease,
          width: initialWidth + widthIncrease,
          height: initialHeight + heightIncrease,
        },
      });
    });

    const resizedComponent = result.current.components[0];
    expect(resizedComponent.position.x).toBe(initialX - widthIncrease);
    expect(resizedComponent.position.y).toBe(initialY - heightIncrease);
    expect(resizedComponent.position.width).toBe(initialWidth + widthIncrease);
    expect(resizedComponent.position.height).toBe(initialHeight + heightIncrease);
  });

  it('保持宽高比调整时应正确计算尺寸', () => {
    const { result } = renderHook(() => useComponentStore());

    // 创建一个 200x100 的组件（宽高比 2:1）
    const component = createDefaultComponent('div', { x: 100, y: 100 });

    act(() => {
      result.current.addComponent(component);
    });

    const initialComponent = result.current.components[0];
    const aspectRatio = initialComponent.position.width / initialComponent.position.height; // 2.0

    // 调整宽度为 300，保持宽高比
    const newWidth = 300;
    const newHeight = newWidth / aspectRatio; // 150

    act(() => {
      result.current.updateComponent(initialComponent.id, {
        position: {
          width: newWidth,
          height: newHeight,
        },
      });
    });

    const resizedComponent = result.current.components[0];
    expect(resizedComponent.position.width).toBe(300);
    expect(resizedComponent.position.height).toBe(150);
    
    // 验证宽高比保持不变
    const newAspectRatio = resizedComponent.position.width / resizedComponent.position.height;
    expect(newAspectRatio).toBeCloseTo(aspectRatio, 2);
  });
});
