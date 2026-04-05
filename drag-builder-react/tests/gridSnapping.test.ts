/**
 * 网格吸附功能测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SnappingEngine } from '../src/utils/snapping';
import type { ComponentNode } from '../src/types';

describe('网格吸附功能', () => {
  let snappingEngine: SnappingEngine;
  
  beforeEach(() => {
    snappingEngine = new SnappingEngine();
  });
  
  /**
   * 创建测试组件
   */
  const createComponent = (x: number, y: number, width = 100, height = 100): ComponentNode => ({
    id: 'test-component',
    type: 'div',
    position: { x, y, width, height, zIndex: 0 },
    styles: {},
    content: {},
  });
  
  describe('基本网格吸附', () => {
    it('应该将组件吸附到最近的网格点（x 轴）', () => {
      // 组件位置在 x=18，最近的网格点是 x=20
      const component = createComponent(18, 0);
      const result = snappingEngine.detectSnapping(
        component,
        [],
        1920,
        1080,
        true  // 启用网格吸附
      );
      
      expect(result.snapX).toBe(20);
    });
    
    it('应该将组件吸附到最近的网格点（y 轴）', () => {
      // 组件位置在 y=22，最近的网格点是 y=20
      const component = createComponent(0, 22);
      const result = snappingEngine.detectSnapping(
        component,
        [],
        1920,
        1080,
        true  // 启用网格吸附
      );
      
      expect(result.snapY).toBe(20);
    });
    
    it('应该同时吸附 x 和 y 轴', () => {
      // 组件位置在 (18, 22)，最近的网格点是 (20, 20)
      const component = createComponent(18, 22);
      const result = snappingEngine.detectSnapping(
        component,
        [],
        1920,
        1080,
        true  // 启用网格吸附
      );
      
      expect(result.snapX).toBe(20);
      expect(result.snapY).toBe(20);
    });
    
    it('应该吸附到网格原点 (0, 0)', () => {
      // 组件位置在 (2, 3)，最近的网格点是 (0, 0)
      const component = createComponent(2, 3);
      const result = snappingEngine.detectSnapping(
        component,
        [],
        1920,
        1080,
        true  // 启用网格吸附
      );
      
      expect(result.snapX).toBe(0);
      expect(result.snapY).toBe(0);
    });
  });
  
  describe('吸附阈值测试', () => {
    it('距离网格点小于阈值时应该吸附', () => {
      // 组件位置在 x=17，距离网格点 20 只有 3px，小于阈值 5px
      const component = createComponent(17, 0);
      const result = snappingEngine.detectSnapping(
        component,
        [],
        1920,
        1080,
        true
      );
      
      expect(result.snapX).toBe(20);
    });
    
    it('距离网格点大于阈值时不应该吸附', () => {
      // 组件位置在 x=14，距离网格点 20 有 6px，大于阈值 5px
      const component = createComponent(14, 0);
      const result = snappingEngine.detectSnapping(
        component,
        [],
        1920,
        1080,
        true
      );
      
      expect(result.snapX).toBeNull();
    });
    
    it('正好在网格点上时应该吸附', () => {
      // 组件位置正好在网格点 (40, 60)
      const component = createComponent(40, 60);
      const result = snappingEngine.detectSnapping(
        component,
        [],
        1920,
        1080,
        true
      );
      
      expect(result.snapX).toBe(40);
      expect(result.snapY).toBe(60);
    });
  });
  
  describe('网格吸附开关', () => {
    it('禁用网格吸附时不应该吸附到网格', () => {
      const component = createComponent(18, 22);
      const result = snappingEngine.detectSnapping(
        component,
        [],
        1920,
        1080,
        false  // 禁用网格吸附
      );
      
      // 没有组件对齐，也没有网格吸附
      expect(result.snapX).toBeNull();
      expect(result.snapY).toBeNull();
    });
    
    it('默认情况下（不传参数）不应该启用网格吸附', () => {
      const component = createComponent(18, 22);
      const result = snappingEngine.detectSnapping(
        component,
        [],
        1920,
        1080
        // 不传 enableGridSnap 参数，默认为 false
      );
      
      expect(result.snapX).toBeNull();
      expect(result.snapY).toBeNull();
    });
  });
  
  describe('网格吸附与组件对齐的优先级', () => {
    it('画布边缘和组件对齐优先于网格吸附', () => {
      // 移动组件在 x=18（接近网格点 20，也接近画布边缘 0）
      const movingComponent = createComponent(2, 0);
      
      const result = snappingEngine.detectSnapping(
        movingComponent,
        [],
        1920,
        1080,
        true  // 启用网格吸附
      );
      
      // 应该吸附到画布边缘（x=0），而不是网格点（x=0 也是网格点，但优先级是画布边缘）
      expect(result.snapX).toBe(0);
      expect(result.snapLines.length).toBeGreaterThan(0);  // 有画布边缘辅助线
    });
    
    it('没有画布边缘和组件对齐时才使用网格吸附', () => {
      // 移动组件在 x=18（接近网格点 20，但不接近画布边缘或其他组件）
      const movingComponent = createComponent(18, 50);
      
      // 其他组件在 x=100（距离很远，不会触发对齐）
      const otherComponent = createComponent(100, 50);
      
      const result = snappingEngine.detectSnapping(
        movingComponent,
        [otherComponent],
        1920,
        1080,
        true  // 启用网格吸附
      );
      
      // 应该吸附到网格点（x=20）
      expect(result.snapX).toBe(20);
      // 没有画布边缘或组件对齐辅助线
      expect(result.snapLines.length).toBe(0);
    });
  });
  
  describe('多个网格点测试', () => {
    it('应该吸附到不同的网格点', () => {
      const testCases = [
        { input: 38, expected: 40 },
        { input: 62, expected: 60 },
        { input: 98, expected: 100 },
        { input: 118, expected: 120 },
      ];
      
      testCases.forEach(({ input, expected }) => {
        const component = createComponent(input, 0);
        const result = snappingEngine.detectSnapping(
          component,
          [],
          1920,
          1080,
          true
        );
        
        expect(result.snapX).toBe(expected);
      });
    });
  });
});
