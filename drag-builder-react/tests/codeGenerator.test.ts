/**
 * 代码生成器测试
 * 测试 CodeGenerator 类的各种功能
 */

import { describe, it, expect } from 'vitest';
import { CodeGenerator } from '../src/utils/codeGenerator';
import type { ComponentNode, CanvasConfig } from '../src/types';

describe('CodeGenerator', () => {
  const generator = new CodeGenerator();

  const mockCanvasConfig: CanvasConfig = {
    width: 800,
    height: 600,
    preset: 'custom',
    backgroundColor: '#FFFFFF',
  };

  describe('generateTSXCode', () => {
    it('应该为空画布生成空组件模板', () => {
      const code = generator.generateTSXCode([], mockCanvasConfig);
      
      expect(code).toContain('import React from');
      expect(code).toContain('const GeneratedPage: React.FC');
      expect(code).toContain('export default GeneratedPage');
      expect(code).toContain('画布为空');
      expect(code).toContain('width: \'800px\'');
      expect(code).toContain('height: \'600px\'');
      expect(code).toContain('backgroundColor: \'#FFFFFF\'');
    });

    it('应该为单个 div 组件生成正确的代码', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-1',
          type: 'div',
          position: { x: 100, y: 100, width: 200, height: 100, zIndex: 1 },
          styles: {
            backgroundColor: '#F1F5F9',
            borderColor: '#E2E8F0',
            borderWidth: 1,
            borderRadius: 8,
          },
          content: {},
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);
      
      expect(code).toContain('<div');
      expect(code).toContain('"position": "absolute"');
      expect(code).toContain('"left": "100px"');
      expect(code).toContain('"top": "100px"');
      expect(code).toContain('"width": "200px"');
      expect(code).toContain('"height": "100px"');
      expect(code).toContain('"backgroundColor": "#F1F5F9"');
      expect(code).toContain('"borderColor": "#E2E8F0"');
      expect(code).toContain('"borderWidth": "1px"');
      expect(code).toContain('"borderRadius": "8px"');
    });

    it('应该为 button 组件生成正确的代码', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-2',
          type: 'button',
          position: { x: 50, y: 50, width: 120, height: 40, zIndex: 1 },
          styles: {
            backgroundColor: '#C2410C',
            textColor: '#FFFFFF',
            borderRadius: 8,
          },
          content: {
            text: '点击我',
          },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);
      
      expect(code).toContain('<button');
      expect(code).toContain('点击我');
      expect(code).toContain('"backgroundColor": "#C2410C"');
      expect(code).toContain('"color": "#FFFFFF"');
      expect(code).toContain('cursor-pointer');
      expect(code).toContain('transition-colors');
    });

    it('应该为 text 组件生成正确的代码', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-3',
          type: 'text',
          position: { x: 0, y: 0, width: 200, height: 30, zIndex: 1 },
          styles: {
            textColor: '#0F172A',
            fontSize: 16,
            fontWeight: 500,
          },
          content: {
            text: '这是一段文本',
          },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);
      
      expect(code).toContain('<p');
      expect(code).toContain('这是一段文本');
      expect(code).toContain('"color": "#0F172A"');
      expect(code).toContain('"fontSize": "16px"');
      expect(code).toContain('"fontWeight": 500');
    });

    it('应该为 image 组件生成正确的代码', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-4',
          type: 'image',
          position: { x: 0, y: 0, width: 200, height: 200, zIndex: 1 },
          styles: {},
          content: {
            src: 'https://example.com/image.jpg',
            alt: '示例图片',
          },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);
      
      expect(code).toContain('<img');
      expect(code).toContain('src="https://example.com/image.jpg"');
      expect(code).toContain('alt="示例图片"');
    });

    it('应该为 input 组件生成正确的代码', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-5',
          type: 'input',
          position: { x: 0, y: 0, width: 240, height: 40, zIndex: 1 },
          styles: {
            borderColor: '#E2E8F0',
            borderWidth: 1,
            borderRadius: 8,
          },
          content: {
            placeholder: '请输入内容',
          },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);
      
      expect(code).toContain('<input');
      expect(code).toContain('placeholder="请输入内容"');
    });

    it('应该按 zIndex 排序组件', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-6',
          type: 'button',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 3 },
          styles: {},
          content: { text: 'Third' },
        },
        {
          id: 'test-7',
          type: 'button',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: { text: 'First' },
        },
        {
          id: 'test-8',
          type: 'button',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 2 },
          styles: {},
          content: { text: 'Second' },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      // 检查顺序：First 应该在 Second 之前，Second 应该在 Third 之前
      const firstIndex = code.indexOf('>First<');
      const secondIndex = code.indexOf('>Second<');
      const thirdIndex = code.indexOf('>Third<');

      expect(firstIndex).toBeLessThan(secondIndex);
      expect(secondIndex).toBeLessThan(thirdIndex);
    });

    it('应该正确映射圆角值到 Tailwind 类名', () => {
      const testCases = [
        { radius: 0, expected: '' },
        { radius: 2, expected: 'rounded-sm' },
        { radius: 4, expected: 'rounded' },
        { radius: 8, expected: 'rounded-lg' },
        { radius: 16, expected: 'rounded-2xl' },
        { radius: 100, expected: 'rounded-full' },
      ];

      testCases.forEach(({ radius, expected }) => {
        const components: ComponentNode[] = [
          {
            id: `test-radius-${radius}`,
            type: 'div',
            position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
            styles: { borderRadius: radius },
            content: {},
          },
        ];

        const code = generator.generateTSXCode(components, mockCanvasConfig);
        
        if (expected) {
          expect(code).toContain(expected);
        }
      });
    });

    it('应该处理阴影配置', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-shadow',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {
            shadow: {
              x: 2,
              y: 4,
              blur: 8,
              color: 'rgba(0, 0, 0, 0.1)',
            },
          },
          content: {},
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);
      
      expect(code).toContain('boxShadow');
      expect(code).toContain('2px 4px 8px rgba(0, 0, 0, 0.1)');
    });

    it('应该生成有效的 TypeScript 代码结构', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-9',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);
      
      // 检查基本结构
      expect(code).toContain('import React from \'react\';');
      expect(code).toContain('const GeneratedPage: React.FC = () => {');
      expect(code).toContain('return (');
      expect(code).toContain('export default GeneratedPage;');
      
      // 检查没有语法错误的迹象
      expect(code).not.toContain('undefined');
      expect(code).not.toContain('[object Object]');
    });

    it('应该为 radio 组件生成单选按钮组', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-radio',
          type: 'radio',
          position: { x: 0, y: 0, width: 200, height: 100, zIndex: 1 },
          styles: {},
          content: {
            options: [
              { id: 'opt-1', label: '选项一', checked: true },
              { id: 'opt-2', label: '选项二', checked: false },
              { id: 'opt-3', label: '选项三', checked: false, disabled: true },
            ],
          },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain('type="radio"');
      expect(code).toContain('name="radio-test-radio"');
      expect(code).toContain('选项一');
      expect(code).toContain('选项二');
      expect(code).toContain('选项三');
      expect(code).toContain('defaultChecked');
      expect(code).toContain('disabled');
    });

    it('应该为 checkbox 组件生成多选按钮组', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-checkbox',
          type: 'checkbox',
          position: { x: 0, y: 0, width: 200, height: 100, zIndex: 1 },
          styles: {},
          content: {
            options: [
              { id: 'cb-1', label: '苹果', checked: true },
              { id: 'cb-2', label: '香蕉', checked: false },
            ],
          },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain('type="checkbox"');
      expect(code).toContain('苹果');
      expect(code).toContain('香蕉');
      expect(code).toContain('defaultChecked');
    });

    it('应该为 radio/checkbox 组件处理空选项列表', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-radio-empty',
          type: 'radio',
          position: { x: 0, y: 0, width: 200, height: 100, zIndex: 1 },
          styles: {},
          content: {},
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);
      // 空选项不应报错，应生成空的容器
      expect(code).toContain('<div');
      expect(code).not.toContain('undefined');
    });

    it('应该为 tag 组件生成 span 元素', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-tag',
          type: 'tag',
          position: { x: 0, y: 0, width: 80, height: 24, zIndex: 1 },
          styles: {
            backgroundColor: '#FEF3C7',
            textColor: '#92400E',
            borderRadius: 4,
          },
          content: { text: '标签文字' },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain('<span');
      expect(code).toContain('标签文字');
      expect(code).toContain('"backgroundColor": "#FEF3C7"');
    });

    it('应该为 image 组件在无 src 时使用占位符', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-img-no-src',
          type: 'image',
          position: { x: 0, y: 0, width: 200, height: 200, zIndex: 1 },
          styles: {},
          content: {},
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain('src="/placeholder.png"');
      expect(code).toContain('alt=""');
    });

    it('应该为 input 组件在无 placeholder 时生成空字符串', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-input-no-placeholder',
          type: 'input',
          position: { x: 0, y: 0, width: 240, height: 40, zIndex: 1 },
          styles: {},
          content: {},
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain('placeholder=""');
    });
  });

  describe('样式转换', () => {
    it('应该正确生成所有样式属性', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-full-styles',
          type: 'div',
          position: { x: 10, y: 20, width: 300, height: 150, zIndex: 5 },
          styles: {
            backgroundColor: '#F8FAFC',
            borderColor: '#CBD5E1',
            borderWidth: 2,
            borderRadius: 12,
            textColor: '#1E293B',
            fontSize: 14,
            fontWeight: 600,
            padding: 16,
          },
          content: {},
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain('"position": "absolute"');
      expect(code).toContain('"left": "10px"');
      expect(code).toContain('"top": "20px"');
      expect(code).toContain('"width": "300px"');
      expect(code).toContain('"height": "150px"');
      expect(code).toContain('"zIndex": 5');
      expect(code).toContain('"backgroundColor": "#F8FAFC"');
      expect(code).toContain('"borderColor": "#CBD5E1"');
      expect(code).toContain('"borderWidth": "2px"');
      expect(code).toContain('"borderStyle": "solid"');
      expect(code).toContain('"borderRadius": "12px"');
      expect(code).toContain('"color": "#1E293B"');
      expect(code).toContain('"fontSize": "14px"');
      expect(code).toContain('"fontWeight": 600');
      expect(code).toContain('"padding": "16px"');
    });

    it('应该在样式为空时只生成位置属性', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-empty-styles',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
          styles: {},
          content: {},
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain('"position": "absolute"');
      // 可选样式不应出现
      expect(code).not.toContain('"backgroundColor"');
      expect(code).not.toContain('"borderColor"');
      expect(code).not.toContain('"fontSize"');
    });

    it('应该正确映射所有圆角值到 Tailwind 类名', () => {
      const cases: Array<{ radius: number; expected: string }> = [
        { radius: 0, expected: '' },
        { radius: 1, expected: 'rounded-sm' },
        { radius: 2, expected: 'rounded-sm' },
        { radius: 3, expected: 'rounded' },
        { radius: 4, expected: 'rounded' },
        { radius: 5, expected: 'rounded-md' },
        { radius: 6, expected: 'rounded-md' },
        { radius: 7, expected: 'rounded-lg' },
        { radius: 8, expected: 'rounded-lg' },
        { radius: 10, expected: 'rounded-xl' },
        { radius: 12, expected: 'rounded-xl' },
        { radius: 14, expected: 'rounded-2xl' },
        { radius: 16, expected: 'rounded-2xl' },
        { radius: 20, expected: 'rounded-3xl' },
        { radius: 24, expected: 'rounded-3xl' },
        { radius: 9999, expected: 'rounded-full' },
      ];

      cases.forEach(({ radius, expected }) => {
        const components: ComponentNode[] = [
          {
            id: `radius-${radius}`,
            type: 'div',
            position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
            styles: { borderRadius: radius },
            content: {},
          },
        ];

        const code = generator.generateTSXCode(components, mockCanvasConfig);

        if (expected) {
          expect(code, `圆角 ${radius}px 应映射为 ${expected}`).toContain(expected);
        } else {
          // radius=0 时不应有 rounded 类名
          expect(code).not.toMatch(/className="[^"]*rounded[^"]*"/);
        }
      });
    });

    it('button 组件应始终包含 cursor-pointer 和 transition-colors 类名', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-btn-classes',
          type: 'button',
          position: { x: 0, y: 0, width: 120, height: 40, zIndex: 1 },
          styles: {},
          content: { text: '按钮' },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain('cursor-pointer');
      expect(code).toContain('transition-colors');
    });

    it('非 button 组件不应包含 cursor-pointer 类名', () => {
      const types: Array<ComponentNode['type']> = ['div', 'text', 'image', 'input', 'tag'];

      types.forEach(type => {
        const components: ComponentNode[] = [
          {
            id: `test-${type}`,
            type,
            position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
            styles: {},
            content: {},
          },
        ];

        const code = generator.generateTSXCode(components, mockCanvasConfig);
        expect(code, `${type} 不应包含 cursor-pointer`).not.toContain('cursor-pointer');
      });
    });
  });

  describe('多组件场景', () => {
    it('应该正确生成多个不同类型的组件', () => {
      const components: ComponentNode[] = [
        {
          id: 'multi-1',
          type: 'div',
          position: { x: 0, y: 0, width: 400, height: 300, zIndex: 1 },
          styles: { backgroundColor: '#F1F5F9' },
          content: {},
        },
        {
          id: 'multi-2',
          type: 'text',
          position: { x: 20, y: 20, width: 200, height: 30, zIndex: 2 },
          styles: { textColor: '#0F172A', fontSize: 18 },
          content: { text: '标题文字' },
        },
        {
          id: 'multi-3',
          type: 'button',
          position: { x: 20, y: 60, width: 120, height: 40, zIndex: 3 },
          styles: { backgroundColor: '#C2410C', textColor: '#FFFFFF', borderRadius: 8 },
          content: { text: '提交' },
        },
        {
          id: 'multi-4',
          type: 'input',
          position: { x: 20, y: 120, width: 240, height: 40, zIndex: 2 },
          styles: { borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 8 },
          content: { placeholder: '请输入邮箱' },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain('<div');
      expect(code).toContain('<p');
      expect(code).toContain('<button');
      expect(code).toContain('<input');
      expect(code).toContain('标题文字');
      expect(code).toContain('提交');
      expect(code).toContain('请输入邮箱');
      // 只有一个 import 和一个 export
      expect(code.match(/import React/g)?.length).toBe(1);
      expect(code.match(/export default/g)?.length).toBe(1);
    });

    it('应该在多组件时按 zIndex 升序排列', () => {
      const components: ComponentNode[] = [
        {
          id: 'z-high',
          type: 'button',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 10 },
          styles: {},
          content: { text: '高层级' },
        },
        {
          id: 'z-low',
          type: 'button',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: { text: '低层级' },
        },
        {
          id: 'z-mid',
          type: 'button',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 5 },
          styles: {},
          content: { text: '中层级' },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      const lowIdx = code.indexOf('>低层级<');
      const midIdx = code.indexOf('>中层级<');
      const highIdx = code.indexOf('>高层级<');

      expect(lowIdx).toBeLessThan(midIdx);
      expect(midIdx).toBeLessThan(highIdx);
    });

    it('应该不修改原始组件数组的顺序', () => {
      const components: ComponentNode[] = [
        {
          id: 'orig-1',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 5 },
          styles: {},
          content: {},
        },
        {
          id: 'orig-2',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
        },
      ];

      const originalOrder = components.map(c => c.id);
      generator.generateTSXCode(components, mockCanvasConfig);
      const afterOrder = components.map(c => c.id);

      expect(afterOrder).toEqual(originalOrder);
    });
  });

  describe('画布配置', () => {
    it('应该在生成的代码中正确反映画布尺寸', () => {
      const config: CanvasConfig = {
        width: 375,
        height: 667,
        preset: 'mobile',
        backgroundColor: '#F8FAFC',
      };

      const code = generator.generateTSXCode([], config);

      expect(code).toContain("width: '375px'");
      expect(code).toContain("height: '667px'");
      expect(code).toContain("backgroundColor: '#F8FAFC'");
    });

    it('应该支持不同的画布预设', () => {
      const presets: Array<CanvasConfig['preset']> = ['mobile', 'tablet', 'desktop', 'custom'];

      presets.forEach(preset => {
        const config: CanvasConfig = {
          width: 800,
          height: 600,
          preset,
          backgroundColor: '#FFFFFF',
        };

        const code = generator.generateTSXCode([], config);
        expect(code, `预设 ${preset} 应生成有效代码`).toContain('GeneratedPage');
      });
    });
  });

  describe('generateCode (新 API)', () => {
    it('应该返回包含 tsx 和可选 css 的结果对象', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-code-api',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: { backgroundColor: '#F1F5F9' },
          content: {},
        },
      ];

      const result = generator.generateCode(components, mockCanvasConfig);

      expect(result).toHaveProperty('tsx');
      expect(result.tsx).toContain('GeneratedPage');
      expect(result.tsx).toContain('<div');
    });

    it('inline 模式不应该生成 css', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-inline',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
        },
      ];

      const result = generator.generateCode(components, mockCanvasConfig, { mode: 'inline' });

      expect(result.css).toBeUndefined();
    });

    it('css 模式应该生成单独的 css 内容', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-css-mode',
          type: 'div',
          position: { x: 10, y: 20, width: 100, height: 50, zIndex: 1 },
          styles: { backgroundColor: '#F1F5F9' },
          content: {},
        },
      ];

      const result = generator.generateCode(components, mockCanvasConfig, { mode: 'css' });

      expect(result.css).toBeDefined();
      expect(result.css).toContain('.comp-test-css-mode');
      expect(result.css).toContain('position: absolute');
      expect(result.css).toContain('left: 10px');
      expect(result.css).toContain('top: 20px');
      expect(result.css).toContain('width: 100px');
      expect(result.css).toContain('height: 50px');
      expect(result.css).toContain('background-color: #F1F5F9');
    });

    it('css 模式应该在 tsx 中生成 className 而非 inline styles', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-css-class',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: { backgroundColor: '#F1F5F9' },
          content: {},
        },
      ];

      const result = generator.generateCode(components, mockCanvasConfig, { mode: 'css' });

      expect(result.tsx).toContain('className="comp-test-css-class"');
      expect(result.tsx).not.toContain('"backgroundColor": "#F1F5F9"');
    });

    it('css 模式应该导入 CSS 文件', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-css-import',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
        },
      ];

      const result = generator.generateCode(components, mockCanvasConfig, { mode: 'css' });

      expect(result.tsx).toContain("import './GeneratedPage.css'");
    });
  });

  describe('动画导出', () => {
    it('有动画配置的组件应该生成 motion.div', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-anim',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
          animation: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.5, delay: 0, ease: 'easeOut' },
          },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain('motion.div');
      expect(code).toContain('initial');
      expect(code).toContain('animate');
      expect(code).toContain('transition');
    });

    it('有动画的组件应该导入 framer-motion', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-anim-import',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
          animation: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.5 },
          },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).toContain("import { motion } from 'framer-motion'");
    });

    it('无动画的组件不应该使用 motion.div', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-no-anim',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      expect(code).not.toContain('motion.div');
      expect(code).not.toContain('initial');
      expect(code).not.toContain('animate');
    });

    it('应该正确序列化动画属性', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-anim-props',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
          animation: {
            initial: { opacity: 0, scale: 0.8 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.5, delay: 0.2, ease: 'easeInOut' },
          },
        },
      ];

      const code = generator.generateTSXCode(components, mockCanvasConfig);

      // JSON.stringify produces {"opacity":0} (no space after colon)
      expect(code).toContain('"opacity":0');
      expect(code).toContain('"scale":0.8');
      expect(code).toContain('"duration":0.5');
      expect(code).toContain('"delay":0.2');
      expect(code).toContain('easeInOut');
    });

    it('generateCode 默认模式应该包含动画', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-anim-default',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
          animation: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.3 },
          },
        },
      ];

      const result = generator.generateCode(components, mockCanvasConfig);

      expect(result.tsx).toContain('motion.div');
    });

    it('includeAnimation: false 时不应该生成动画代码', () => {
      const components: ComponentNode[] = [
        {
          id: 'test-anim-disabled',
          type: 'div',
          position: { x: 0, y: 0, width: 100, height: 100, zIndex: 1 },
          styles: {},
          content: {},
          animation: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.3 },
          },
        },
      ];

      const result = generator.generateCode(components, mockCanvasConfig, { includeAnimation: false });

      expect(result.tsx).not.toContain('motion.div');
      expect(result.tsx).not.toContain('initial');
      expect(result.tsx).not.toContain('animate');
    });
  });
});
