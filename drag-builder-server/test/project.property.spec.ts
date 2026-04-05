import 'reflect-metadata';
import fc from 'fast-check';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CanvasConfigDto,
} from '../src/modules/project/project.dto';

/**
 * Project 模块属性测试
 *
 * 属性 19：项目持久化完整性
 * 属性 20：API 输入验证
 * 属性 21：项目数据往返一致性
 *
 * 需求：11.2, 11.3, 11.4, 11.5, 11.6, 10.8
 */

// ============================================================
// 通用 Arbitrary 生成器
// ============================================================

/**
 * 生成有效的 HEX 颜色字符串
 */
const validHexColor = (): fc.Arbitrary<string> =>
  fc
    .tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 })
    )
    .map(
      ([r, g, b]) =>
        `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    );

/**
 * 生成有效的画布预设类型
 */
const validPreset = (): fc.Arbitrary<'mobile' | 'tablet' | 'desktop' | 'custom'> =>
  fc.constantFrom('mobile', 'tablet', 'desktop', 'custom');

/**
 * 生成有效的 CanvasConfigDto 数据
 */
const validCanvasConfigData = () =>
  fc.record({
    width: fc.integer({ min: 100, max: 5000 }),
    height: fc.integer({ min: 100, max: 5000 }),
    preset: validPreset(),
    backgroundColor: validHexColor(),
  });

/**
 * 生成有效的项目名称
 */
const validProjectName = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0);

/**
 * Mock 组件节点类型（用于 fast-check 属性测试）
 */
interface MockComponentNode {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  };
  styles?: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
  };
  content?: {
    text?: string;
  };
}

/**
 * 生成有效的组件树数据（简化版）
 */
const validComponentsTree = (): fc.Arbitrary<MockComponentNode[]> =>
  fc.array(
    fc.record({
      id: fc.uuid(),
      type: fc.constantFrom('div', 'button', 'text', 'image', 'input'),
      position: fc.record({
        x: fc.integer({ min: 0, max: 5000 }),
        y: fc.integer({ min: 0, max: 5000 }),
        width: fc.integer({ min: 20, max: 1000 }),
        height: fc.integer({ min: 20, max: 1000 }),
        zIndex: fc.integer({ min: 0, max: 999 }),
      }),
      styles: fc.record({
        backgroundColor: fc.option(validHexColor(), { nil: undefined }),
        borderColor: fc.option(validHexColor(), { nil: undefined }),
        borderWidth: fc.option(fc.integer({ min: 0, max: 20 }), { nil: undefined }),
        borderRadius: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
      }),
      content: fc.record({
        text: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
      }),
    }),
    { maxLength: 20 }
  );

/**
 * 生成有效的 CreateProjectDto 数据
 */
const validCreateProjectData = () =>
  fc.record({
    name: validProjectName(),
    canvasConfig: validCanvasConfigData(),
    componentsTree: validComponentsTree(),
  });

// ============================================================
// 属性 19：项目持久化完整性
// ============================================================

/**
 * 属性 19：项目持久化完整性
 *
 * 对于任何有效的项目数据，DTO 验证应该通过，
 * 且所有必需字段都应该被正确保留。
 *
 * 验证需求：11.4, 11.5, 11.6
 */
describe('属性 19：项目持久化完整性', () => {
  it('对于任何有效的项目数据，CreateProjectDto 验证应该通过', async () => {
    await fc.assert(
      fc.asyncProperty(validCreateProjectData(), async data => {
        const dto = plainToInstance(CreateProjectDto, data);
        const errors = await validate(dto);

        // 验证：有效数据不应该产生验证错误
        expect(errors.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('对于任何有效的项目数据，所有必需字段都应该被保留', async () => {
    await fc.assert(
      fc.asyncProperty(validCreateProjectData(), async data => {
        const dto = plainToInstance(CreateProjectDto, data);
        const errors = await validate(dto);

        if (errors.length === 0) {
          // 验证：name 字段被保留
          expect(dto.name).toBe(data.name);

          // 验证：canvasConfig 字段被保留
          expect(dto.canvasConfig.width).toBe(data.canvasConfig.width);
          expect(dto.canvasConfig.height).toBe(data.canvasConfig.height);
          expect(dto.canvasConfig.preset).toBe(data.canvasConfig.preset);
          expect(dto.canvasConfig.backgroundColor).toBe(data.canvasConfig.backgroundColor);

          // 验证：componentsTree 字段被保留
          expect(dto.componentsTree).toHaveLength(data.componentsTree.length);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('对于任何有效的画布配置，CanvasConfigDto 验证应该通过', async () => {
    await fc.assert(
      fc.asyncProperty(validCanvasConfigData(), async data => {
        const dto = plainToInstance(CanvasConfigDto, data);
        const errors = await validate(dto);

        // 验证：有效的画布配置不应该产生验证错误
        expect(errors.length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('对于任何有效的更新数据，UpdateProjectDto 验证应该通过', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.option(validProjectName(), { nil: undefined }),
          canvasConfig: fc.option(validCanvasConfigData(), { nil: undefined }),
          componentsTree: fc.option(validComponentsTree(), { nil: undefined }),
        }),
        async data => {
          // 过滤掉 undefined 字段
          const filteredData = Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== undefined)
          );

          const dto = plainToInstance(UpdateProjectDto, filteredData);
          const errors = await validate(dto);

          // 验证：有效的部分更新数据不应该产生验证错误
          expect(errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// 属性 20：API 输入验证
// ============================================================

/**
 * 属性 20：API 输入验证
 *
 * 对于任何无效的输入数据，DTO 验证应该拒绝，
 * 并返回明确的错误信息。
 *
 * 验证需求：11.2, 11.3
 */
describe('属性 20：API 输入验证', () => {
  /**
   * 属性 20.1：画布尺寸边界验证
   * 对于任何超出范围的画布尺寸（<100 或 >5000），验证应该失败
   */
  it('对于任何超出范围的画布宽度，验证应该失败', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer({ min: -10000, max: 99 }), // 小于最小值
          fc.integer({ min: 5001, max: 10000 }) // 大于最大值
        ),
        async invalidWidth => {
          const dto = plainToInstance(CanvasConfigDto, {
            width: invalidWidth,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          });

          const errors = await validate(dto);

          // 验证：无效宽度应该产生验证错误
          expect(errors.length).toBeGreaterThan(0);
          const widthError = errors.find(e => e.property === 'width');
          expect(widthError).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('对于任何超出范围的画布高度，验证应该失败', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(fc.integer({ min: -10000, max: 99 }), fc.integer({ min: 5001, max: 10000 })),
        async invalidHeight => {
          const dto = plainToInstance(CanvasConfigDto, {
            width: 1440,
            height: invalidHeight,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          });

          const errors = await validate(dto);

          expect(errors.length).toBeGreaterThan(0);
          const heightError = errors.find(e => e.property === 'height');
          expect(heightError).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 20.2：HEX 颜色格式验证
   * 对于任何非 HEX 格式的颜色字符串，验证应该失败
   */
  it('对于任何无效的 HEX 颜色格式，验证应该失败', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成不符合 #RRGGBB 格式的字符串
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !/^#[0-9A-Fa-f]{6}$/.test(s)),
        async invalidColor => {
          const dto = plainToInstance(CanvasConfigDto, {
            width: 1440,
            height: 900,
            preset: 'desktop',
            backgroundColor: invalidColor,
          });

          const errors = await validate(dto);

          // 验证：无效颜色格式应该产生验证错误
          expect(errors.length).toBeGreaterThan(0);
          const colorError = errors.find(e => e.property === 'backgroundColor');
          expect(colorError).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 20.3：无效 preset 值验证
   * 对于任何不在枚举范围内的 preset 值，验证应该失败
   */
  it('对于任何无效的 preset 值，验证应该失败', async () => {
    const validPresets = new Set(['mobile', 'tablet', 'desktop', 'custom']);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !validPresets.has(s)),
        async invalidPreset => {
          const dto = plainToInstance(CanvasConfigDto, {
            width: 1440,
            height: 900,
            preset: invalidPreset,
            backgroundColor: '#FFFFFF',
          });

          const errors = await validate(dto);

          // 验证：无效 preset 应该产生验证错误
          expect(errors.length).toBeGreaterThan(0);
          const presetError = errors.find(e => e.property === 'preset');
          expect(presetError).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 20.4：项目名称长度验证
   * 对于任何超过 255 字符的项目名称，验证应该失败
   */
  it('对于任何超过 255 字符的项目名称，验证应该失败', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .integer({ min: 256, max: 1000 })
          .chain(len => fc.string({ minLength: len, maxLength: len })),
        async longName => {
          const dto = plainToInstance(CreateProjectDto, {
            name: longName,
            canvasConfig: {
              width: 1440,
              height: 900,
              preset: 'desktop',
              backgroundColor: '#FFFFFF',
            },
            componentsTree: [],
          });

          const errors = await validate(dto);

          // 验证：超长名称应该产生验证错误
          expect(errors.length).toBeGreaterThan(0);
          const nameError = errors.find(e => e.property === 'name');
          expect(nameError).toBeDefined();
          expect(nameError?.constraints?.maxLength).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * 属性 20.5：空项目名称验证
   * 空字符串或仅含空白的名称应该验证失败
   */
  it('空项目名称应该验证失败', async () => {
    const dto = plainToInstance(CreateProjectDto, {
      name: '',
      canvasConfig: {
        width: 1440,
        height: 900,
        preset: 'desktop',
        backgroundColor: '#FFFFFF',
      },
      componentsTree: [],
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const nameError = errors.find(e => e.property === 'name');
    expect(nameError).toBeDefined();
    expect(nameError?.constraints?.isNotEmpty).toBeDefined();
  });

  /**
   * 属性 20.6：缺少必需字段验证
   * 对于缺少任何必需字段的请求，验证应该失败
   */
  it('缺少 name 字段时验证应该失败', async () => {
    await fc.assert(
      fc.asyncProperty(
        validCanvasConfigData(),
        validComponentsTree(),
        async (canvasConfig, componentsTree) => {
          const dto = plainToInstance(CreateProjectDto, { canvasConfig, componentsTree });
          const errors = await validate(dto);

          expect(errors.length).toBeGreaterThan(0);
          const nameError = errors.find(e => e.property === 'name');
          expect(nameError).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('缺少 canvasConfig 字段时验证应该失败', async () => {
    await fc.assert(
      fc.asyncProperty(validProjectName(), validComponentsTree(), async (name, componentsTree) => {
        const dto = plainToInstance(CreateProjectDto, { name, componentsTree });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const configError = errors.find(e => e.property === 'canvasConfig');
        expect(configError).toBeDefined();
      }),
      { numRuns: 50 }
    );
  });

  it('缺少 componentsTree 字段时验证应该失败', async () => {
    await fc.assert(
      fc.asyncProperty(validProjectName(), validCanvasConfigData(), async (name, canvasConfig) => {
        const dto = plainToInstance(CreateProjectDto, { name, canvasConfig });
        const errors = await validate(dto);

        expect(errors.length).toBeGreaterThan(0);
        const treeError = errors.find(e => e.property === 'componentsTree');
        expect(treeError).toBeDefined();
      }),
      { numRuns: 50 }
    );
  });

  /**
   * 属性 20.7：componentsTree 类型验证
   * 非数组类型的 componentsTree 应该验证失败
   */
  it('对于非数组类型的 componentsTree，验证应该失败', async () => {
    await fc.assert(
      fc.asyncProperty(
        // 生成非数组类型的值
        fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.record({ key: fc.string() })),
        async invalidTree => {
          const dto = plainToInstance(CreateProjectDto, {
            name: '测试项目',
            canvasConfig: {
              width: 1440,
              height: 900,
              preset: 'desktop',
              backgroundColor: '#FFFFFF',
            },
            componentsTree: invalidTree,
          });

          const errors = await validate(dto);

          // 验证：非数组类型应该产生验证错误
          expect(errors.length).toBeGreaterThan(0);
          const treeError = errors.find(e => e.property === 'componentsTree');
          expect(treeError).toBeDefined();
          expect(treeError?.constraints?.isArray).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================
// 属性 21：项目数据往返一致性
// ============================================================

/**
 * 属性 21：项目数据往返一致性
 *
 * 对于任何有效的项目数据，经过 DTO 序列化/反序列化后，
 * 数据应该保持完整性和一致性。
 *
 * 验证需求：11.4, 11.5, 10.8
 */
describe('属性 21：项目数据往返一致性', () => {
  /**
   * 属性 21.1：画布配置往返一致性
   * 有效的画布配置经过 DTO 转换后，所有字段值应该保持不变
   */
  it('有效的画布配置经过 DTO 转换后，字段值应该保持不变', async () => {
    await fc.assert(
      fc.asyncProperty(validCanvasConfigData(), async data => {
        const dto = plainToInstance(CanvasConfigDto, data);
        const errors = await validate(dto);

        if (errors.length === 0) {
          // 验证：所有字段值保持不变
          expect(dto.width).toBe(data.width);
          expect(dto.height).toBe(data.height);
          expect(dto.preset).toBe(data.preset);
          expect(dto.backgroundColor).toBe(data.backgroundColor);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 21.2：组件树往返一致性
   * 有效的组件树经过 DTO 转换后，数组长度和元素顺序应该保持不变
   */
  it('有效的组件树经过 DTO 转换后，数组长度应该保持不变', async () => {
    await fc.assert(
      fc.asyncProperty(validCreateProjectData(), async data => {
        const dto = plainToInstance(CreateProjectDto, data);
        const errors = await validate(dto);

        if (errors.length === 0) {
          // 验证：组件树长度保持不变
          expect(dto.componentsTree).toHaveLength(data.componentsTree.length);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 21.3：组件树元素完整性
   * 组件树中每个组件的 id、type、position 字段应该被完整保留
   */
  it('组件树中每个组件的核心字段应该被完整保留', async () => {
    await fc.assert(
      fc.asyncProperty(validCreateProjectData(), async data => {
        const dto = plainToInstance(CreateProjectDto, data);
        const errors = await validate(dto);

        if (errors.length === 0 && data.componentsTree.length > 0) {
          data.componentsTree.forEach((originalComp: MockComponentNode, index) => {
            const dtoComp = dto.componentsTree[index] as MockComponentNode;

            // 验证：核心字段被保留
            expect(dtoComp.id).toBe(originalComp.id);
            expect(dtoComp.type).toBe(originalComp.type);
            expect(dtoComp.position.x).toBe(originalComp.position.x);
            expect(dtoComp.position.y).toBe(originalComp.position.y);
            expect(dtoComp.position.width).toBe(originalComp.position.width);
            expect(dtoComp.position.height).toBe(originalComp.position.height);
            expect(dtoComp.position.zIndex).toBe(originalComp.position.zIndex);
          });
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 21.4：UpdateProjectDto 部分更新一致性
   * 部分更新时，只有提供的字段应该被更新，未提供的字段应该保持 undefined
   */
  it('UpdateProjectDto 部分更新时，只有提供的字段应该存在', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          updateName: fc.boolean(),
          updateCanvas: fc.boolean(),
          updateTree: fc.boolean(),
          name: validProjectName(),
          canvasConfig: validCanvasConfigData(),
          componentsTree: validComponentsTree(),
        }),
        async data => {
          const updateData: Record<string, unknown> = {};
          if (data.updateName) updateData.name = data.name;
          if (data.updateCanvas) updateData.canvasConfig = data.canvasConfig;
          if (data.updateTree) updateData.componentsTree = data.componentsTree;

          const dto = plainToInstance(UpdateProjectDto, updateData);
          const errors = await validate(dto);

          // 验证：部分更新数据应该通过验证
          expect(errors.length).toBe(0);

          // 验证：提供的字段应该存在
          if (data.updateName) {
            expect(dto.name).toBe(data.name);
          }
          if (data.updateCanvas) {
            expect(dto.canvasConfig?.width).toBe(data.canvasConfig.width);
            expect(dto.canvasConfig?.height).toBe(data.canvasConfig.height);
          }
          if (data.updateTree) {
            expect(dto.componentsTree).toHaveLength(data.componentsTree.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 属性 21.5：画布尺寸边界值往返一致性
   * 边界值（100 和 5000）经过 DTO 转换后应该保持不变
   */
  it('画布尺寸边界值经过 DTO 转换后应该保持不变', async () => {
    const boundaryValues = [100, 5000];

    for (const value of boundaryValues) {
      const dto = plainToInstance(CanvasConfigDto, {
        width: value,
        height: value,
        preset: 'custom',
        backgroundColor: '#FFFFFF',
      });

      const errors = await validate(dto);

      // 验证：边界值应该通过验证
      expect(errors.length).toBe(0);

      // 验证：边界值被正确保留
      expect(dto.width).toBe(value);
      expect(dto.height).toBe(value);
    }
  });

  /**
   * 属性 21.6：所有预设类型往返一致性
   * 所有有效的 preset 值经过 DTO 转换后应该保持不变
   */
  it('所有有效的 preset 值经过 DTO 转换后应该保持不变', async () => {
    const presets: Array<'mobile' | 'tablet' | 'desktop' | 'custom'> = [
      'mobile',
      'tablet',
      'desktop',
      'custom',
    ];

    for (const preset of presets) {
      const dto = plainToInstance(CanvasConfigDto, {
        width: 1440,
        height: 900,
        preset,
        backgroundColor: '#FFFFFF',
      });

      const errors = await validate(dto);

      // 验证：所有预设类型应该通过验证
      expect(errors.length).toBe(0);

      // 验证：preset 值被正确保留
      expect(dto.preset).toBe(preset);
    }
  });

  /**
   * 属性 21.7：有效数据验证通过 + 无效数据验证失败的互斥性
   * 有效数据和无效数据的验证结果应该是互斥的
   */
  it('有效画布配置验证通过，无效画布配置验证失败（互斥性）', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          validCanvasConfigData(),
          // 生成至少一个字段无效的配置
          fc.record({
            width: fc.oneof(
              fc.integer({ min: -10000, max: 99 }),
              fc.integer({ min: 5001, max: 10000 })
            ),
            height: fc.integer({ min: 100, max: 5000 }),
            preset: validPreset(),
            backgroundColor: validHexColor(),
          })
        ),
        async ([validData, invalidData]) => {
          const validDto = plainToInstance(CanvasConfigDto, validData);
          const invalidDto = plainToInstance(CanvasConfigDto, invalidData);

          const validErrors = await validate(validDto);
          const invalidErrors = await validate(invalidDto);

          // 验证：有效数据通过，无效数据失败
          expect(validErrors.length).toBe(0);
          expect(invalidErrors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
