/**
 * MaterialPanel 组件测试
 * 测试物料配置和默认组件创建
 */

import { describe, it, expect } from 'vitest';
import { MATERIAL_CONFIGS, createDefaultComponent } from '../src/components/MaterialPanel';

describe('MaterialPanel - 物料配置测试', () => {
  it('应该包含 8 个组件（5个基础 + 3个表单）', () => {
    expect(MATERIAL_CONFIGS).toHaveLength(8);
    
    const types = MATERIAL_CONFIGS.map(config => config.type);
    // 基础组件
    expect(types).toContain('div');
    expect(types).toContain('button');
    expect(types).toContain('text');
    expect(types).toContain('image');
    expect(types).toContain('input');
    // 表单组件
    expect(types).toContain('radio');
    expect(types).toContain('checkbox');
    expect(types).toContain('tag');
  });

  it('每个物料配置应该包含必要的字段', () => {
    MATERIAL_CONFIGS.forEach(config => {
      expect(config).toHaveProperty('type');
      expect(config).toHaveProperty('label');
      expect(config).toHaveProperty('icon');
      expect(config).toHaveProperty('description');
    });
  });

  describe('createDefaultComponent - Div 组件', () => {
    it('应该创建正确尺寸的 Div 组件（200x100px）', () => {
      const component = createDefaultComponent('div', { x: 100, y: 200 });
      
      expect(component.type).toBe('div');
      expect(component.position.x).toBe(100);
      expect(component.position.y).toBe(200);
      expect(component.position.width).toBe(200);
      expect(component.position.height).toBe(100);
    });

    it('Div 组件应该有边框和圆角', () => {
      const component = createDefaultComponent('div');
      
      expect(component.styles.borderColor).toBe('#E2E8F0'); // slate-200
      expect(component.styles.borderWidth).toBe(1);
      expect(component.styles.borderRadius).toBe(16);
    });
  });

  describe('createDefaultComponent - Button 组件', () => {
    it('应该创建正确尺寸的 Button 组件（120x40px）', () => {
      const component = createDefaultComponent('button', { x: 50, y: 100 });
      
      expect(component.type).toBe('button');
      expect(component.position.width).toBe(120);
      expect(component.position.height).toBe(40);
    });

    it('Button 组件应该有橙红色背景和白色文字', () => {
      const component = createDefaultComponent('button');
      
      expect(component.styles.backgroundColor).toBe('#C2410C');
      expect(component.styles.textColor).toBe('#FFFFFF');
      expect(component.styles.borderRadius).toBe(8);
    });

    it('Button 组件应该有默认文本', () => {
      const component = createDefaultComponent('button');
      
      expect(component.content.text).toBe('按钮');
    });
  });

  describe('createDefaultComponent - Text 组件', () => {
    it('应该创建 Text 组件', () => {
      const component = createDefaultComponent('text');
      
      expect(component.type).toBe('text');
      expect(component.styles.fontSize).toBe(16);
      expect(component.styles.textColor).toBe('#0F172A'); // slate-900
    });

    it('Text 组件应该有默认文本内容', () => {
      const component = createDefaultComponent('text');
      
      expect(component.content.text).toBe('文本内容');
    });
  });

  describe('createDefaultComponent - Image 组件', () => {
    it('应该创建正确尺寸的 Image 组件（200x200px）', () => {
      const component = createDefaultComponent('image');
      
      expect(component.type).toBe('image');
      expect(component.position.width).toBe(200);
      expect(component.position.height).toBe(200);
    });

    it('Image 组件应该有占位符背景', () => {
      const component = createDefaultComponent('image');
      
      expect(component.styles.backgroundColor).toBe('#F1F5F9'); // slate-100
    });
  });

  describe('createDefaultComponent - Input 组件', () => {
    it('应该创建正确尺寸的 Input 组件（240x40px）', () => {
      const component = createDefaultComponent('input');
      
      expect(component.type).toBe('input');
      expect(component.position.width).toBe(240);
      expect(component.position.height).toBe(40);
    });

    it('Input 组件应该有边框和圆角', () => {
      const component = createDefaultComponent('input');
      
      expect(component.styles.borderColor).toBe('#E2E8F0'); // slate-200
      expect(component.styles.borderWidth).toBe(1);
      expect(component.styles.borderRadius).toBe(8);
    });

    it('Input 组件应该有占位符文本', () => {
      const component = createDefaultComponent('input');
      
      expect(component.content.placeholder).toBe('请输入内容');
    });
  });

  describe('createDefaultComponent - 通用属性', () => {
    it('所有组件都应该有唯一的 UUID', () => {
      const component1 = createDefaultComponent('div');
      const component2 = createDefaultComponent('div');
      
      expect(component1.id).toBeTruthy();
      expect(component2.id).toBeTruthy();
      expect(component1.id).not.toBe(component2.id);
    });

    it('所有组件的 zIndex 应该初始化为 0', () => {
      const types: Array<'div' | 'button' | 'text' | 'image' | 'input'> = 
        ['div', 'button', 'text', 'image', 'input'];
      
      types.forEach(type => {
        const component = createDefaultComponent(type);
        expect(component.position.zIndex).toBe(0);
      });
    });

    it('应该使用提供的位置参数', () => {
      const component = createDefaultComponent('div', { x: 300, y: 400 });
      
      expect(component.position.x).toBe(300);
      expect(component.position.y).toBe(400);
    });

    it('未提供位置时应该默认为 (0, 0)', () => {
      const component = createDefaultComponent('div');
      
      expect(component.position.x).toBe(0);
      expect(component.position.y).toBe(0);
    });
  });
});
