/**
 * 组件嵌套工具函数测试
 */

import { describe, it, expect } from 'vitest';
import {
  isComponentInside,
  findComponentsInside,
  calculateRelativePosition,
  applyRelativePosition,
  buildNestingMap,
} from '../src/utils/componentNesting';
import type { ComponentNode } from '../src/types';

// 创建测试用的组件
const createTestComponent = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): ComponentNode => ({
  id,
  type: 'div',
  position: { x, y, width, height, zIndex: 0 },
  styles: {},
  content: {},
});

describe('componentNesting', () => {
  describe('isComponentInside', () => {
    it('应该正确检测完全包含的组件', () => {
      const container = createTestComponent('container', 0, 0, 200, 200);
      const child = createTestComponent('child', 50, 50, 100, 100);
      
      expect(isComponentInside(container, child)).toBe(true);
    });
    
    it('应该正确检测不包含的组件', () => {
      const container = createTestComponent('container', 0, 0, 200, 200);
      const outside = createTestComponent('outside', 250, 250, 100, 100);
      
      expect(isComponentInside(container, outside)).toBe(false);
    });
    
    it('应该正确检测部分重叠的组件', () => {
      const container = createTestComponent('container', 0, 0, 200, 200);
      const overlap = createTestComponent('overlap', 150, 150, 100, 100);
      
      expect(isComponentInside(container, overlap)).toBe(false);
    });
    
    it('应该正确检测边界重合的组件', () => {
      const container = createTestComponent('container', 0, 0, 200, 200);
      const edge = createTestComponent('edge', 0, 0, 200, 200);
      
      expect(isComponentInside(container, edge)).toBe(true);
    });
  });
  
  describe('findComponentsInside', () => {
    it('应该找出所有内部组件', () => {
      const container = createTestComponent('container', 0, 0, 300, 300);
      const child1 = createTestComponent('child1', 50, 50, 100, 100);
      const child2 = createTestComponent('child2', 150, 150, 100, 100);
      const outside = createTestComponent('outside', 350, 350, 100, 100);
      
      const allComponents = [container, child1, child2, outside];
      const insideComponents = findComponentsInside(container, allComponents);
      
      expect(insideComponents).toHaveLength(2);
      expect(insideComponents.map(c => c.id)).toContain('child1');
      expect(insideComponents.map(c => c.id)).toContain('child2');
      expect(insideComponents.map(c => c.id)).not.toContain('outside');
    });
    
    it('应该排除容器自身', () => {
      const container = createTestComponent('container', 0, 0, 200, 200);
      const allComponents = [container];
      const insideComponents = findComponentsInside(container, allComponents);
      
      expect(insideComponents).toHaveLength(0);
    });
  });
  
  describe('calculateRelativePosition', () => {
    it('应该正确计算相对位置', () => {
      const container = createTestComponent('container', 100, 100, 200, 200);
      const child = createTestComponent('child', 150, 150, 50, 50);
      
      const relativePos = calculateRelativePosition(container, child);
      
      expect(relativePos.xRatio).toBe(0.25); // (150-100)/200
      expect(relativePos.yRatio).toBe(0.25); // (150-100)/200
      expect(relativePos.widthRatio).toBe(0.25); // 50/200
      expect(relativePos.heightRatio).toBe(0.25); // 50/200
    });
    
    it('应该处理左上角对齐的子组件', () => {
      const container = createTestComponent('container', 0, 0, 200, 200);
      const child = createTestComponent('child', 0, 0, 100, 100);
      
      const relativePos = calculateRelativePosition(container, child);
      
      expect(relativePos.xRatio).toBe(0);
      expect(relativePos.yRatio).toBe(0);
      expect(relativePos.widthRatio).toBe(0.5);
      expect(relativePos.heightRatio).toBe(0.5);
    });
  });
  
  describe('applyRelativePosition', () => {
    it('应该根据相对位置计算新的绝对位置', () => {
      const newContainer = createTestComponent('container', 200, 200, 400, 400);
      const relativePos = {
        xRatio: 0.25,
        yRatio: 0.25,
        widthRatio: 0.25,
        heightRatio: 0.25,
      };
      
      const newPos = applyRelativePosition(newContainer, relativePos);
      
      expect(newPos.x).toBe(300); // 200 + 400*0.25
      expect(newPos.y).toBe(300); // 200 + 400*0.25
      expect(newPos.width).toBe(100); // 400*0.25
      expect(newPos.height).toBe(100); // 400*0.25
    });
    
    it('应该正确处理容器缩小的情况', () => {
      const newContainer = createTestComponent('container', 100, 100, 100, 100);
      const relativePos = {
        xRatio: 0.5,
        yRatio: 0.5,
        widthRatio: 0.5,
        heightRatio: 0.5,
      };
      
      const newPos = applyRelativePosition(newContainer, relativePos);
      
      expect(newPos.x).toBe(150); // 100 + 100*0.5
      expect(newPos.y).toBe(150); // 100 + 100*0.5
      expect(newPos.width).toBe(50); // 100*0.5
      expect(newPos.height).toBe(50); // 100*0.5
    });
  });
  
  describe('buildNestingMap', () => {
    it('应该构建正确的嵌套关系图', () => {
      const container1 = createTestComponent('container1', 0, 0, 300, 300);
      const child1 = createTestComponent('child1', 50, 50, 100, 100);
      const child2 = createTestComponent('child2', 150, 150, 100, 100);
      const container2 = createTestComponent('container2', 400, 400, 200, 200);
      const child3 = createTestComponent('child3', 450, 450, 100, 100);
      
      const allComponents = [container1, child1, child2, container2, child3];
      const nestingMap = buildNestingMap(allComponents);
      
      expect(nestingMap.size).toBe(2);
      expect(nestingMap.get('container1')).toEqual(['child1', 'child2']);
      expect(nestingMap.get('container2')).toEqual(['child3']);
    });
    
    it('应该处理没有嵌套的情况', () => {
      const comp1 = createTestComponent('comp1', 0, 0, 100, 100);
      const comp2 = createTestComponent('comp2', 200, 200, 100, 100);
      
      const allComponents = [comp1, comp2];
      const nestingMap = buildNestingMap(allComponents);
      
      expect(nestingMap.size).toBe(0);
    });
    
    it('应该处理多层嵌套', () => {
      const outer = createTestComponent('outer', 0, 0, 400, 400);
      const middle = createTestComponent('middle', 50, 50, 300, 300);
      const inner = createTestComponent('inner', 100, 100, 200, 200);
      
      const allComponents = [outer, middle, inner];
      const nestingMap = buildNestingMap(allComponents);
      
      expect(nestingMap.size).toBe(2);
      expect(nestingMap.get('outer')).toEqual(['middle', 'inner']);
      expect(nestingMap.get('middle')).toEqual(['inner']);
    });
  });
});
