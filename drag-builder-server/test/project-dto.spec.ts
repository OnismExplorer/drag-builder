import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateProjectDto,
  UpdateProjectDto,
  CanvasConfigDto,
} from '../src/modules/project/project.dto';

/**
 * DTO 验证单元测试
 *
 * 测试目标：
 * - 必需字段验证
 * - 数值范围验证
 * - 格式验证（颜色 HEX 格式）
 *
 * 需求：11.2, 11.3
 */
describe('Project DTOs Validation', () => {
  describe('CanvasConfigDto', () => {
    describe('必需字段验证', () => {
      it('应该验证通过 - 所有字段都有效', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证失败 - 缺少 width 字段', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('width');
      });

      it('应该验证失败 - 缺少 height 字段', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('height');
      });

      it('应该验证失败 - 缺少 preset 字段', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('preset');
      });

      it('应该验证失败 - 缺少 backgroundColor 字段', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('backgroundColor');
      });
    });

    describe('数值范围验证', () => {
      it('应该验证失败 - width 小于最小值 100', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 50,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const widthError = errors.find(e => e.property === 'width');
        expect(widthError).toBeDefined();
        expect(widthError?.constraints?.min).toContain('100px');
      });

      it('应该验证失败 - width 大于最大值 5000', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 6000,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const widthError = errors.find(e => e.property === 'width');
        expect(widthError).toBeDefined();
        expect(widthError?.constraints?.max).toContain('5000px');
      });

      it('应该验证通过 - width 等于最小值 100', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 100,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - width 等于最大值 5000', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 5000,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证失败 - height 小于最小值 100', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 50,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const heightError = errors.find(e => e.property === 'height');
        expect(heightError).toBeDefined();
        expect(heightError?.constraints?.min).toContain('100px');
      });

      it('应该验证失败 - height 大于最大值 5000', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 6000,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const heightError = errors.find(e => e.property === 'height');
        expect(heightError).toBeDefined();
        expect(heightError?.constraints?.max).toContain('5000px');
      });

      it('应该验证通过 - height 等于最小值 100', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 100,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - height 等于最大值 5000', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 5000,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    describe('格式验证 - HEX 颜色', () => {
      it('应该验证通过 - 有效的 HEX 颜色（大写）', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - 有效的 HEX 颜色（小写）', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#ffffff',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - 有效的 HEX 颜色（混合大小写）', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#C2410C',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证失败 - 缺少 # 符号', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: 'FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const bgError = errors.find(e => e.property === 'backgroundColor');
        expect(bgError).toBeDefined();
        expect(bgError?.constraints?.matches).toContain('HEX');
      });

      it('应该验证失败 - 颜色值太短（5 位）', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const bgError = errors.find(e => e.property === 'backgroundColor');
        expect(bgError).toBeDefined();
        expect(bgError?.constraints?.matches).toContain('HEX');
      });

      it('应该验证失败 - 颜色值太长（7 位）', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const bgError = errors.find(e => e.property === 'backgroundColor');
        expect(bgError).toBeDefined();
        expect(bgError?.constraints?.matches).toContain('HEX');
      });

      it('应该验证失败 - 包含非法字符（G）', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#GGGGGG',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const bgError = errors.find(e => e.property === 'backgroundColor');
        expect(bgError).toBeDefined();
        expect(bgError?.constraints?.matches).toContain('HEX');
      });

      it('应该验证失败 - 空字符串', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const bgError = errors.find(e => e.property === 'backgroundColor');
        expect(bgError).toBeDefined();
      });
    });

    describe('preset 字段验证', () => {
      it('应该验证通过 - preset 为 mobile', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 375,
          height: 667,
          preset: 'mobile',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - preset 为 tablet', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 768,
          height: 1024,
          preset: 'tablet',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - preset 为 desktop', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - preset 为 custom', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 800,
          height: 600,
          preset: 'custom',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证失败 - preset 为无效值', async () => {
        const dto = plainToInstance(CanvasConfigDto, {
          width: 1440,
          height: 900,
          preset: 'invalid',
          backgroundColor: '#FFFFFF',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const presetError = errors.find(e => e.property === 'preset');
        expect(presetError).toBeDefined();
        expect(presetError?.constraints?.isIn).toBeDefined();
      });
    });
  });

  describe('CreateProjectDto', () => {
    describe('必需字段验证', () => {
      it('应该验证通过 - 所有字段都有效', async () => {
        const dto = plainToInstance(CreateProjectDto, {
          name: '测试项目',
          canvasConfig: {
            width: 1440,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          },
          componentsTree: [],
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证失败 - 缺少 name 字段', async () => {
        const dto = plainToInstance(CreateProjectDto, {
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
      });

      it('应该验证失败 - name 为空字符串', async () => {
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

      it('应该验证失败 - 缺少 canvasConfig 字段', async () => {
        const dto = plainToInstance(CreateProjectDto, {
          name: '测试项目',
          componentsTree: [],
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const configError = errors.find(e => e.property === 'canvasConfig');
        expect(configError).toBeDefined();
      });

      it('应该验证失败 - 缺少 componentsTree 字段', async () => {
        const dto = plainToInstance(CreateProjectDto, {
          name: '测试项目',
          canvasConfig: {
            width: 1440,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          },
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const treeError = errors.find(e => e.property === 'componentsTree');
        expect(treeError).toBeDefined();
      });
    });

    describe('嵌套验证 - canvasConfig', () => {
      it('应该验证失败 - canvasConfig 中的 width 无效', async () => {
        const dto = plainToInstance(CreateProjectDto, {
          name: '测试项目',
          canvasConfig: {
            width: 50,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          },
          componentsTree: [],
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const configError = errors.find(e => e.property === 'canvasConfig');
        expect(configError).toBeDefined();
      });

      it('应该验证失败 - canvasConfig 中的 backgroundColor 无效', async () => {
        const dto = plainToInstance(CreateProjectDto, {
          name: '测试项目',
          canvasConfig: {
            width: 1440,
            height: 900,
            preset: 'desktop',
            backgroundColor: 'FFFFFF',
          },
          componentsTree: [],
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const configError = errors.find(e => e.property === 'canvasConfig');
        expect(configError).toBeDefined();
      });
    });

    describe('name 字段长度验证', () => {
      it('应该验证通过 - name 长度为 255 字符', async () => {
        const longName = 'a'.repeat(255);
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
        expect(errors.length).toBe(0);
      });

      it('应该验证失败 - name 长度超过 255 字符', async () => {
        const longName = 'a'.repeat(256);
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
        expect(errors.length).toBeGreaterThan(0);
        const nameError = errors.find(e => e.property === 'name');
        expect(nameError).toBeDefined();
        expect(nameError?.constraints?.maxLength).toContain('255');
      });
    });

    describe('componentsTree 类型验证', () => {
      it('应该验证通过 - componentsTree 为空数组', async () => {
        const dto = plainToInstance(CreateProjectDto, {
          name: '测试项目',
          canvasConfig: {
            width: 1440,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          },
          componentsTree: [],
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - componentsTree 包含组件数据', async () => {
        const dto = plainToInstance(CreateProjectDto, {
          name: '测试项目',
          canvasConfig: {
            width: 1440,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          },
          componentsTree: [
            {
              id: 'test-id',
              type: 'div',
              position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 },
            },
          ],
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证失败 - componentsTree 不是数组', async () => {
        const dto = plainToInstance(CreateProjectDto, {
          name: '测试项目',
          canvasConfig: {
            width: 1440,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          },
          componentsTree: 'not-an-array',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const treeError = errors.find(e => e.property === 'componentsTree');
        expect(treeError).toBeDefined();
        expect(treeError?.constraints?.isArray).toBeDefined();
      });
    });
  });

  describe('UpdateProjectDto', () => {
    describe('可选字段验证', () => {
      it('应该验证通过 - 所有字段都为空（部分更新）', async () => {
        const dto = plainToInstance(UpdateProjectDto, {});

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - 仅更新 name', async () => {
        const dto = plainToInstance(UpdateProjectDto, {
          name: '更新后的项目名称',
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - 仅更新 canvasConfig', async () => {
        const dto = plainToInstance(UpdateProjectDto, {
          canvasConfig: {
            width: 1440,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          },
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - 仅更新 componentsTree', async () => {
        const dto = plainToInstance(UpdateProjectDto, {
          componentsTree: [],
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });

      it('应该验证通过 - 更新所有字段', async () => {
        const dto = plainToInstance(UpdateProjectDto, {
          name: '更新后的项目名称',
          canvasConfig: {
            width: 1440,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          },
          componentsTree: [],
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    describe('字段验证规则（当提供时）', () => {
      it('应该验证失败 - name 超过最大长度', async () => {
        const longName = 'a'.repeat(256);
        const dto = plainToInstance(UpdateProjectDto, {
          name: longName,
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const nameError = errors.find(e => e.property === 'name');
        expect(nameError).toBeDefined();
        expect(nameError?.constraints?.maxLength).toContain('255');
      });

      it('应该验证失败 - canvasConfig 中的值无效', async () => {
        const dto = plainToInstance(UpdateProjectDto, {
          canvasConfig: {
            width: 50,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          },
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const configError = errors.find(e => e.property === 'canvasConfig');
        expect(configError).toBeDefined();
      });

      it('应该验证失败 - componentsTree 不是数组', async () => {
        const dto = plainToInstance(UpdateProjectDto, {
          componentsTree: 'not-an-array',
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        const treeError = errors.find(e => e.property === 'componentsTree');
        expect(treeError).toBeDefined();
        expect(treeError?.constraints?.isArray).toBeDefined();
      });
    });
  });
});
