/**
 * 画布缩放功能测试
 * 测试画布缩放时组件位置保持不变
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentStore } from '../src/store/componentStore';
import { useCanvasStore } from '../src/store/canvasStore';
import { createDefaultComponent } from '../src/components/MaterialPanel';

describe('画布缩放功能', () => {
  beforeEach(() => {
    // 每个测试前清空状态
    const { clearAll } = useComponentStore.getState();
    const { resetCanvas } = useCanvasStore.getState();
    clearAll();
    resetCanvas();
  });

  it('缩放画布时组件的逻辑位置应保持不变', () => {
    const { result: componentResult } = renderHook(() => useComponentStore());
    const { result: canvasResult } = renderHook(() => useCanvasStore());

    // 在画布上创建一个组件
    const component = createDefaultComponent('button', { x: 100, y: 200 });

    act(() => {
      componentResult.current.addComponent(component);
    });

    // 记录初始位置
    const initialComponent = componentResult.current.components[0];
    const initialX = initialComponent.position.x;
    const initialY = initialComponent.position.y;

    expect(initialX).toBe(100);
    expect(initialY).toBe(200);

    // 放大画布到 150%
    act(() => {
      canvasResult.current.setZoom(1.5);
    });

    // 验证组件的逻辑位置没有改变
    const componentAfterZoom = componentResult.current.components[0];
    expect(componentAfterZoom.position.x).toBe(initialX);
    expect(componentAfterZoom.position.y).toBe(initialY);

    // 缩小画布到 50%
    act(() => {
      canvasResult.current.setZoom(0.5);
    });

    // 再次验证组件的逻辑位置没有改变
    const componentAfterZoomOut = componentResult.current.components[0];
    expect(componentAfterZoomOut.position.x).toBe(initialX);
    expect(componentAfterZoomOut.position.y).toBe(initialY);
  });

  it('缩放画布不应影响多个组件的相对位置关系', () => {
    const { result: componentResult } = renderHook(() => useComponentStore());
    const { result: canvasResult } = renderHook(() => useCanvasStore());

    // 创建两个组件
    const component1 = createDefaultComponent('button', { x: 100, y: 100 });
    const component2 = createDefaultComponent('div', { x: 300, y: 200 });

    act(() => {
      componentResult.current.addComponent(component1);
      componentResult.current.addComponent(component2);
    });

    // 计算初始相对距离
    const comp1Initial = componentResult.current.components[0];
    const comp2Initial = componentResult.current.components[1];
    const initialDeltaX = comp2Initial.position.x - comp1Initial.position.x;
    const initialDeltaY = comp2Initial.position.y - comp1Initial.position.y;

    expect(initialDeltaX).toBe(200); // 300 - 100
    expect(initialDeltaY).toBe(100); // 200 - 100

    // 放大画布
    act(() => {
      canvasResult.current.setZoom(2.0);
    });

    // 验证相对距离保持不变
    const comp1AfterZoom = componentResult.current.components[0];
    const comp2AfterZoom = componentResult.current.components[1];
    const deltaXAfterZoom = comp2AfterZoom.position.x - comp1AfterZoom.position.x;
    const deltaYAfterZoom = comp2AfterZoom.position.y - comp1AfterZoom.position.y;

    expect(deltaXAfterZoom).toBe(initialDeltaX);
    expect(deltaYAfterZoom).toBe(initialDeltaY);
  });

  it('缩放范围应限制在 0.1 到 2.0 之间', () => {
    const { result } = renderHook(() => useCanvasStore());

    // 尝试设置超出范围的缩放值
    act(() => {
      result.current.setZoom(3.0); // 超过最大值
    });

    expect(result.current.zoom).toBe(2.0); // 应该被限制为 2.0

    act(() => {
      result.current.setZoom(0.05); // 低于最小值
    });

    expect(result.current.zoom).toBe(0.1); // 应该被限制为 0.1

    // 设置正常范围内的值
    act(() => {
      result.current.setZoom(1.5);
    });

    expect(result.current.zoom).toBe(1.5);
  });

  it('重置画布应将缩放恢复到 100%', () => {
    const { result } = renderHook(() => useCanvasStore());

    // 修改缩放
    act(() => {
      result.current.setZoom(1.8);
    });

    expect(result.current.zoom).toBe(1.8);

    // 重置画布
    act(() => {
      result.current.resetCanvas();
    });

    expect(result.current.zoom).toBe(1.0);
  });
});
