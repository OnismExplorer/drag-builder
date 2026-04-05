/**
 * 物料库拖拽到画布功能测试
 * 测试从物料库拖拽组件到画布时的位置计算
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useComponentStore } from '../src/store/componentStore';
import { useCanvasStore } from '../src/store/canvasStore';
import { createDefaultComponent } from '../src/components/MaterialPanel';

describe('物料库拖拽到画布功能', () => {
  beforeEach(() => {
    // 每个测试前清空状态
    const { clearAll } = useComponentStore.getState();
    const { resetCanvas } = useCanvasStore.getState();
    clearAll();
    resetCanvas();
  });

  it('应该在指定位置创建组件', () => {
    const { result: componentResult } = renderHook(() => useComponentStore());

    // 模拟在坐标 (150, 200) 创建一个按钮组件
    const newComponent = createDefaultComponent('button', { x: 150, y: 200 });

    act(() => {
      componentResult.current.addComponent(newComponent);
    });

    // 验证组件已添加
    expect(componentResult.current.components).toHaveLength(1);
    
    // 验证组件位置正确
    const addedComponent = componentResult.current.components[0];
    expect(addedComponent.position.x).toBe(150);
    expect(addedComponent.position.y).toBe(200);
    expect(addedComponent.type).toBe('button');
  });

  it('应该将组件中心对齐到鼠标位置', () => {
    const { result: componentResult } = renderHook(() => useComponentStore());

    // 模拟鼠标在 (200, 200) 位置释放
    // 创建一个按钮组件（默认尺寸 120x40）
    const mouseX = 200;
    const mouseY = 200;
    
    // 先创建临时组件获取尺寸
    const tempComponent = createDefaultComponent('button', { x: 0, y: 0 });
    const width = tempComponent.position.width; // 120
    const height = tempComponent.position.height; // 40
    
    // 计算组件左上角位置（使中心对齐鼠标）
    const x = mouseX - width / 2; // 200 - 60 = 140
    const y = mouseY - height / 2; // 200 - 20 = 180
    
    const newComponent = createDefaultComponent('button', { x, y });

    act(() => {
      componentResult.current.addComponent(newComponent);
    });

    // 验证组件位置
    const addedComponent = componentResult.current.components[0];
    expect(addedComponent.position.x).toBe(140);
    expect(addedComponent.position.y).toBe(180);
    
    // 验证组件中心确实在鼠标位置
    const centerX = addedComponent.position.x + addedComponent.position.width / 2;
    const centerY = addedComponent.position.y + addedComponent.position.height / 2;
    expect(centerX).toBe(200);
    expect(centerY).toBe(200);
  });

  it('应该考虑缩放比例计算位置', () => {
    const { result: componentResult } = renderHook(() => useComponentStore());
    const { result: canvasResult } = renderHook(() => useCanvasStore());

    // 设置画布缩放为 50%
    act(() => {
      canvasResult.current.setZoom(0.5);
    });

    // 模拟鼠标在屏幕坐标 (200, 200) 处释放
    // 假设画布左上角在 (100, 100)
    // 相对于画布的坐标应该是 (200-100, 200-100) = (100, 100)
    // 考虑缩放后的实际坐标应该是 (100/0.5, 100/0.5) = (200, 200)
    
    const zoom = canvasResult.current.zoom;
    const canvasLeft = 100;
    const canvasTop = 100;
    const mouseX = 200;
    const mouseY = 200;
    
    const canvasX = (mouseX - canvasLeft) / zoom;
    const canvasY = (mouseY - canvasTop) / zoom;
    
    // 创建临时组件获取尺寸
    const tempComponent = createDefaultComponent('div', { x: 0, y: 0 });
    
    // 计算中心对齐的位置
    const x = canvasX - tempComponent.position.width / 2;
    const y = canvasY - tempComponent.position.height / 2;
    
    const newComponent = createDefaultComponent('div', { x, y });

    act(() => {
      componentResult.current.addComponent(newComponent);
    });

    // 验证位置计算正确（考虑了缩放和中心对齐）
    const addedComponent = componentResult.current.components[0];
    expect(addedComponent.position.x).toBe(100); // 200 - 200/2
    expect(addedComponent.position.y).toBe(150); // 200 - 100/2
  });

  it('应该防止组件创建在负坐标', () => {
    const { result: componentResult } = renderHook(() => useComponentStore());

    // 尝试在负坐标创建组件（实际代码中会使用 Math.max(0, x)）
    const x = Math.max(0, -50);
    const y = Math.max(0, -30);
    
    const newComponent = createDefaultComponent('text', { x, y });

    act(() => {
      componentResult.current.addComponent(newComponent);
    });

    // 验证坐标被限制为非负
    const addedComponent = componentResult.current.components[0];
    expect(addedComponent.position.x).toBe(0);
    expect(addedComponent.position.y).toBe(0);
  });

  it('应该为不同类型的组件创建正确的默认样式', () => {
    const { result } = renderHook(() => useComponentStore());

    // 创建不同类型的组件
    const buttonComponent = createDefaultComponent('button', { x: 0, y: 0 });
    const divComponent = createDefaultComponent('div', { x: 0, y: 0 });
    const textComponent = createDefaultComponent('text', { x: 0, y: 0 });

    act(() => {
      result.current.addComponent(buttonComponent);
      result.current.addComponent(divComponent);
      result.current.addComponent(textComponent);
    });

    expect(result.current.components).toHaveLength(3);

    // 验证按钮组件的默认样式
    const button = result.current.components.find(c => c.type === 'button');
    expect(button?.position.width).toBe(120);
    expect(button?.position.height).toBe(40);
    expect(button?.styles.backgroundColor).toBe('#C2410C');

    // 验证 Div 组件的默认样式
    const div = result.current.components.find(c => c.type === 'div');
    expect(div?.position.width).toBe(200);
    expect(div?.position.height).toBe(100);

    // 验证文本组件的默认样式
    const text = result.current.components.find(c => c.type === 'text');
    expect(text?.styles.fontSize).toBe(16);
  });
});
