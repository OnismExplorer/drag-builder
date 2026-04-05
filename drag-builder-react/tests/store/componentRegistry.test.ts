/**
 * ComponentRegistry 测试
 * 测试组件注册表的核心 API 功能
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { componentRegistry } from '../../src/store/componentRegistry';
import { registerBuiltInComponents } from '../../src/components/built-in';
import type { ComponentDefinition } from '../../src/store/componentRegistry';

// 测试用的临时组件定义
const testDefinition: ComponentDefinition = {
  type: 'test-component',
  material: {
    type: 'test-component',
    label: '测试组件',
    icon: 'Test',
    description: '用于测试的组件',
    backgroundColor: '#FFFFFF',
    category: 'test',
  },
  defaults: {
    position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
    styles: { backgroundColor: '#FFFFFF' },
    content: { text: '测试' },
  },
  propertyGroups: [],
  render: () => null,
  codeGen: {
    generateJSX: () => '<div>Test</div>',
  },
};

// 在所有测试前初始化内置组件
beforeAll(() => {
  registerBuiltInComponents();
});

describe('ComponentRegistry', () => {
  beforeEach(() => {
    // 每个测试前清理测试组件
    componentRegistry.unregister('test-component');
    componentRegistry.unregister('test-component-2');
  });

  describe('register and get', () => {
    it('应该能够注册并获取组件定义', () => {
      componentRegistry.register(testDefinition);
      const def = componentRegistry.get('test-component');

      expect(def).toBeDefined();
      expect(def?.type).toBe('test-component');
      expect(def?.material.label).toBe('测试组件');
    });

    it('应该返回 undefined 对于未注册的组件', () => {
      const def = componentRegistry.get('non-existent');
      expect(def).toBeUndefined();
    });

    it('应该覆盖已注册的组件', () => {
      componentRegistry.register(testDefinition);
      const updatedDef = { ...testDefinition, material: { ...testDefinition.material, label: '更新后的组件' } };
      componentRegistry.register(updatedDef);

      const def = componentRegistry.get('test-component');
      expect(def?.material.label).toBe('更新后的组件');
    });
  });

  describe('registerMany', () => {
    it('应该能够批量注册组件', () => {
      const definitions = [
        { ...testDefinition, type: 'test-component' },
        { ...testDefinition, type: 'test-component-2' },
      ];

      componentRegistry.registerMany(definitions);

      expect(componentRegistry.get('test-component')).toBeDefined();
      expect(componentRegistry.get('test-component-2')).toBeDefined();
    });
  });

  describe('unregister', () => {
    it('应该能够注销组件', () => {
      componentRegistry.register(testDefinition);
      const result = componentRegistry.unregister('test-component');

      expect(result).toBe(true);
      expect(componentRegistry.get('test-component')).toBeUndefined();
    });

    it('应该返回 false 对于未注册的组件', () => {
      const result = componentRegistry.unregister('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('getAll', () => {
    it('应该返回所有已注册的组件', () => {
      componentRegistry.register(testDefinition);
      const all = componentRegistry.getAll();

      expect(all.length).toBeGreaterThan(0);
      expect(all.some(d => d.type === 'test-component')).toBe(true);
    });
  });

  describe('getByCategory', () => {
    it('应该返回指定分类的组件', () => {
      componentRegistry.register(testDefinition);
      const basic = componentRegistry.getByCategory('test');

      expect(basic.some(d => d.type === 'test-component')).toBe(true);
    });
  });

  describe('createDefault', () => {
    it('应该为已注册的组件类型创建默认节点', () => {
      // 先注册内置组件（确保有组件可用）
      const buttonDef = componentRegistry.get('button');
      if (!buttonDef) {
        // 如果 button 未注册，跳过此测试
        return;
      }

      const node = componentRegistry.createDefault('button', { x: 100, y: 200 });

      expect(node).toBeDefined();
      expect(node?.type).toBe('button');
      expect(node?.position.x).toBe(100);
      expect(node?.position.y).toBe(200);
    });

    it('应该为未注册的组件类型返回 null', () => {
      const node = componentRegistry.createDefault('non-existent-type', { x: 0, y: 0 });
      expect(node).toBeNull();
    });
  });

  describe('内置组件', () => {
    it('应该包含内置组件', () => {
      const all = componentRegistry.getAll();
      const builtInTypes = ['div', 'button', 'text', 'image', 'input', 'radio', 'checkbox', 'tag'];

      builtInTypes.forEach(type => {
        expect(all.some(d => d.type === type)).toBe(true);
      });
    });

    it('内置组件应该有正确的默认位置', () => {
      const button = componentRegistry.createDefault('button', { x: 50, y: 100 });

      expect(button?.position.x).toBe(50);
      expect(button?.position.y).toBe(100);
      expect(button?.position.width).toBeGreaterThan(0);
      expect(button?.position.height).toBeGreaterThan(0);
    });
  });
});
