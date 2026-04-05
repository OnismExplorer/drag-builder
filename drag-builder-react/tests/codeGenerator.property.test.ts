/**
 * 代码生成器属性测试
 * 使用 fast-check 进行基于属性的测试
 *
 * 属性 18：代码生成有效性
 * 每个属性测试运行 100 次迭代
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { CodeGenerator } from '../src/utils/codeGenerator';
import type { ComponentNode, CanvasConfig, ComponentType } from '../src/types';

// ─── 测试辅助函数 ────────────────────────────────────────────────────────────

/**
 * 生成合法的 HEX 颜色字符串
 */
const hexColor = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
  ).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

/**
 * 生成合法的画布配置
 */
const canvasConfig = (): fc.Arbitrary<CanvasConfig> =>
  fc.record({
    width: fc.integer({ min: 100, max: 5000 }),
    height: fc.integer({ min: 100, max: 5000 }),
    preset: fc.constantFrom('mobile', 'tablet', 'desktop', 'custom') as fc.Arbitrary<CanvasConfig['preset']>,
    backgroundColor: hexColor(),
  });

/**
 * 生成合法的组件节点
 */
const componentNode = (): fc.Arbitrary<ComponentNode> =>
  fc.record({
    id: fc.uuid(),
    type: fc.constantFrom<ComponentType>('div', 'button', 'text', 'image', 'input'),
    position: fc.record({
      x: fc.integer({ min: 0, max: 4000 }),
      y: fc.integer({ min: 0, max: 4000 }),
      width: fc.integer({ min: 20, max: 2000 }),
      height: fc.integer({ min: 20, max: 2000 }),
      zIndex: fc.integer({ min: 0, max: 999 }),
    }),
    styles: fc.record({
      backgroundColor: fc.option(hexColor(), { nil: undefined }),
      borderColor: fc.option(hexColor(), { nil: undefined }),
      borderWidth: fc.option(fc.integer({ min: 0, max: 20 }), { nil: undefined }),
      borderRadius: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
      textColor: fc.option(hexColor(), { nil: undefined }),
      fontSize: fc.option(fc.integer({ min: 8, max: 72 }), { nil: undefined }),
      fontWeight: fc.option(fc.integer({ min: 100, max: 900 }), { nil: undefined }),
      padding: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
    }),
    content: fc.record({
      text: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
      src: fc.option(fc.webUrl(), { nil: undefined }),
      placeholder: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
      alt: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
    }),
  });

/**
 * 生成非空组件数组（1 到 10 个组件）
 */
const componentArray = (): fc.Arbitrary<ComponentNode[]> =>
  fc.array(componentNode(), { minLength: 1, maxLength: 10 });

// ─── 属性 18：代码生成有效性 ──────────────────────────────────────────────────

describe('属性 18：代码生成有效性', () => {
  const generator = new CodeGenerator();

  // ── 18.1 生成的代码必须包含必要的 import 语句 ──────────────────────────────

  describe('18.1 生成的代码必须包含必要的 import 语句', () => {
    it('对于任意非空组件树，生成的代码应包含 React import', () => {
      fc.assert(
        fc.property(componentArray(), canvasConfig(), (components, config) => {
          const code = generator.generateTSXCode(components, config);

          // 必须包含 React import
          expect(code).toContain("import React from 'react'");
        }),
        { numRuns: 100 },
      );
    });

    it('对于空画布，生成的代码也应包含 React import', () => {
      fc.assert(
        fc.property(canvasConfig(), (config) => {
          const code = generator.generateTSXCode([], config);

          // 空模板也必须包含 React import
          expect(code).toContain("import React from 'react'");
        }),
        { numRuns: 100 },
      );
    });
  });

  // ── 18.2 生成的代码必须包含有效的组件结构 ─────────────────────────────────

  describe('18.2 生成的代码必须包含有效的组件结构', () => {
    it('对于任意组件树，生成的代码应包含组件函数声明', () => {
      fc.assert(
        fc.property(componentArray(), canvasConfig(), (components, config) => {
          const code = generator.generateTSXCode(components, config);

          // 必须包含组件函数声明
          expect(code).toContain('const GeneratedPage: React.FC = () =>');
        }),
        { numRuns: 100 },
      );
    });

    it('对于任意组件树，生成的代码应包含 export default 语句', () => {
      fc.assert(
        fc.property(componentArray(), canvasConfig(), (components, config) => {
          const code = generator.generateTSXCode(components, config);

          // 必须包含 export default
          expect(code).toContain('export default GeneratedPage');
        }),
        { numRuns: 100 },
      );
    });

    it('对于任意组件树，生成的代码应包含 return 语句和 JSX', () => {
      fc.assert(
        fc.property(componentArray(), canvasConfig(), (components, config) => {
          const code = generator.generateTSXCode(components, config);

          // 必须包含 return 和 JSX 根元素
          expect(code).toContain('return (');
          expect(code).toContain('<div');
        }),
        { numRuns: 100 },
      );
    });
  });

  // ── 18.3 生成的代码必须反映画布配置 ───────────────────────────────────────

  describe('18.3 生成的代码必须反映画布配置', () => {
    it('对于任意画布配置，生成的代码应包含正确的画布宽度', () => {
      fc.assert(
        fc.property(componentArray(), canvasConfig(), (components, config) => {
          const code = generator.generateTSXCode(components, config);

          // 必须包含画布宽度
          expect(code).toContain(`width: '${config.width}px'`);
        }),
        { numRuns: 100 },
      );
    });

    it('对于任意画布配置，生成的代码应包含正确的画布高度', () => {
      fc.assert(
        fc.property(componentArray(), canvasConfig(), (components, config) => {
          const code = generator.generateTSXCode(components, config);

          // 必须包含画布高度
          expect(code).toContain(`height: '${config.height}px'`);
        }),
        { numRuns: 100 },
      );
    });

    it('对于任意画布配置，生成的代码应包含正确的背景色', () => {
      fc.assert(
        fc.property(componentArray(), canvasConfig(), (components, config) => {
          const code = generator.generateTSXCode(components, config);

          // 必须包含背景色
          expect(code).toContain(`backgroundColor: '${config.backgroundColor}'`);
        }),
        { numRuns: 100 },
      );
    });
  });

  // ── 18.4 空画布生成空模板 ──────────────────────────────────────────────────

  describe('18.4 空画布生成空模板', () => {
    it('对于任意画布配置，空组件数组应生成包含空注释的模板', () => {
      fc.assert(
        fc.property(canvasConfig(), (config) => {
          const code = generator.generateTSXCode([], config);

          // 空模板应包含空画布注释
          expect(code).toContain('{/* 画布为空 */}');
        }),
        { numRuns: 100 },
      );
    });

    it('空画布生成的代码应仍然是完整可用的组件', () => {
      fc.assert(
        fc.property(canvasConfig(), (config) => {
          const code = generator.generateTSXCode([], config);

          // 空模板也必须是完整的组件
          expect(code).toContain("import React from 'react'");
          expect(code).toContain('const GeneratedPage: React.FC = () =>');
          expect(code).toContain('export default GeneratedPage');
        }),
        { numRuns: 100 },
      );
    });

    it('空画布与非空画布生成的代码结构应一致', () => {
      fc.assert(
        fc.property(canvasConfig(), (config) => {
          const emptyCode = generator.generateTSXCode([], config);
          const codeWithComponent = generator.generateTSXCode(
            [
              {
                id: 'test-id',
                type: 'div',
                position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
                styles: {},
                content: {},
              },
            ],
            config,
          );

          // 两者都应包含相同的基础结构
          const requiredParts = [
            "import React from 'react'",
            'const GeneratedPage: React.FC = () =>',
            'export default GeneratedPage',
          ];

          for (const part of requiredParts) {
            expect(emptyCode).toContain(part);
            expect(codeWithComponent).toContain(part);
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  // ── 18.5 生成的代码必须包含组件的位置信息 ─────────────────────────────────

  describe('18.5 生成的代码必须包含组件的位置信息', () => {
    it('对于任意组件，生成的代码应包含 position: absolute 样式', () => {
      fc.assert(
        fc.property(componentNode(), canvasConfig(), (component, config) => {
          const code = generator.generateTSXCode([component], config);

          // 每个组件必须使用绝对定位
          expect(code).toContain('"position": "absolute"');
        }),
        { numRuns: 100 },
      );
    });

    it('对于任意组件，生成的代码应包含正确的 left 和 top 坐标', () => {
      fc.assert(
        fc.property(componentNode(), canvasConfig(), (component, config) => {
          const code = generator.generateTSXCode([component], config);

          // 必须包含组件的 x/y 坐标
          expect(code).toContain(`"left": "${component.position.x}px"`);
          expect(code).toContain(`"top": "${component.position.y}px"`);
        }),
        { numRuns: 100 },
      );
    });

    it('对于任意组件，生成的代码应包含正确的宽高', () => {
      fc.assert(
        fc.property(componentNode(), canvasConfig(), (component, config) => {
          const code = generator.generateTSXCode([component], config);

          // 必须包含组件的宽高
          expect(code).toContain(`"width": "${component.position.width}px"`);
          expect(code).toContain(`"height": "${component.position.height}px"`);
        }),
        { numRuns: 100 },
      );
    });
  });

  // ── 18.6 生成的代码对所有组件类型都有效 ───────────────────────────────────

  describe('18.6 生成的代码对所有组件类型都有效', () => {
    const allTypes: ComponentType[] = ['div', 'button', 'text', 'image', 'input'];

    /**
     * 为每种组件类型创建一个基础组件
     */
    const makeComponent = (type: ComponentType): ComponentNode => ({
      id: `test-${type}`,
      type,
      position: { x: 10, y: 10, width: 100, height: 50, zIndex: 0 },
      styles: { backgroundColor: '#ffffff', borderRadius: 8 },
      content: {
        text: type === 'button' || type === 'text' ? '测试内容' : undefined,
        src: type === 'image' ? 'https://example.com/img.png' : undefined,
        placeholder: type === 'input' ? '请输入' : undefined,
        alt: type === 'image' ? '测试图片' : undefined,
      },
    });

    const defaultConfig: CanvasConfig = {
      width: 800,
      height: 600,
      preset: 'desktop',
      backgroundColor: '#ffffff',
    };

    it('div 组件应生成 <div> 标签', () => {
      const code = generator.generateTSXCode([makeComponent('div')], defaultConfig);
      expect(code).toContain('<div className=');
    });

    it('button 组件应生成 <button> 标签', () => {
      const code = generator.generateTSXCode([makeComponent('button')], defaultConfig);
      expect(code).toContain('<button className=');
    });

    it('text 组件应生成 <p> 标签', () => {
      const code = generator.generateTSXCode([makeComponent('text')], defaultConfig);
      expect(code).toContain('<p className=');
    });

    it('image 组件应生成 <img> 标签', () => {
      const code = generator.generateTSXCode([makeComponent('image')], defaultConfig);
      expect(code).toContain('<img src=');
    });

    it('input 组件应生成 <input> 标签', () => {
      const code = generator.generateTSXCode([makeComponent('input')], defaultConfig);
      expect(code).toContain('<input placeholder=');
    });

    it('对于任意组件类型，生成的代码不应为空', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<ComponentType>(...allTypes),
          canvasConfig(),
          (type, config) => {
            const component = makeComponent(type);
            const code = generator.generateTSXCode([component], config);

            // 生成的代码不应为空
            expect(code.trim().length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ── 18.7 多组件时 zIndex 排序不变量 ───────────────────────────────────────

  describe('18.7 多组件时 zIndex 排序不变量', () => {
    it('对于任意多组件数组，生成的代码应包含所有组件', () => {
      fc.assert(
        fc.property(
          fc.array(componentNode(), { minLength: 2, maxLength: 5 }),
          canvasConfig(),
          (components, config) => {
            const code = generator.generateTSXCode(components, config);

            // 每个组件的 zIndex 都应出现在生成的代码中
            for (const component of components) {
              expect(code).toContain(`"zIndex": ${component.position.zIndex}`);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
