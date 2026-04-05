import {
  IsString,
  IsNotEmpty,
  IsObject,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsIn,
  Matches,
  MaxLength,
  IsOptional,
  IsUUID,
  IsEnum,
  IsBoolean,
  IsOptional as IsOptionalDecorator,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 位置和尺寸 DTO
 */
export class PositionDto {
  @IsNumber()
  @Min(0)
  x!: number;

  @IsNumber()
  @Min(0)
  y!: number;

  @IsNumber()
  @Min(1)
  width!: number;

  @IsNumber()
  @Min(1)
  height!: number;

  @IsNumber()
  @Min(0)
  @Max(999)
  zIndex!: number;
}

/**
 * 阴影配置 DTO
 */
export class ShadowConfigDto {
  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsNumber()
  @Min(0)
  blur!: number;

  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color!: string;
}

/**
 * 样式配置 DTO
 */
export class ComponentStylesDto {
  @IsString()
  @IsOptionalDecorator()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  backgroundColor?: string;

  @IsString()
  @IsOptionalDecorator()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  borderColor?: string;

  @IsNumber()
  @IsOptionalDecorator()
  @Min(0)
  borderWidth?: number;

  @IsNumber()
  @IsOptionalDecorator()
  @Min(0)
  borderRadius?: number;

  @IsString()
  @IsOptionalDecorator()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  textColor?: string;

  @IsNumber()
  @IsOptionalDecorator()
  @Min(1)
  fontSize?: number;

  @IsNumber()
  @IsOptionalDecorator()
  @Min(100)
  @Max(900)
  fontWeight?: number;

  @IsNumber()
  @IsOptionalDecorator()
  @Min(0)
  padding?: number;

  @ValidateNested()
  @IsOptionalDecorator()
  @Type(() => ShadowConfigDto)
  shadow?: ShadowConfigDto;
}

/**
 * 单选/多选选项 DTO
 */
export class RadioCheckboxOptionDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsBoolean()
  checked!: boolean;

  @IsBoolean()
  @IsOptionalDecorator()
  disabled?: boolean;
}

/**
 * 内容配置 DTO
 */
export class ComponentContentDto {
  @IsString()
  @IsOptionalDecorator()
  text?: string;

  @IsString()
  @IsOptionalDecorator()
  src?: string;

  @IsString()
  @IsOptionalDecorator()
  placeholder?: string;

  @IsString()
  @IsOptionalDecorator()
  alt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RadioCheckboxOptionDto)
  @IsOptionalDecorator()
  options?: RadioCheckboxOptionDto[];
}

/**
 * 动画配置 DTO
 */
export class AnimationConfigDto {
  @IsObject()
  @IsOptionalDecorator()
  initial?: Record<string, string | number | boolean>;

  @IsObject()
  @IsOptionalDecorator()
  animate?: Record<string, string | number | boolean>;

  @IsObject()
  @IsOptionalDecorator()
  transition?: {
    duration: number;
    delay: number;
    ease: string;
  };
}

/**
 * 组件节点 DTO
 * 验证画布上的组件节点数据结构
 */
export class ComponentNodeDto {
  @IsString()
  @IsUUID('4')
  id!: string;

  @IsEnum(['div', 'button', 'text', 'image', 'input', 'radio', 'checkbox', 'tag'])
  type!: string;

  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto;

  @ValidateNested()
  @Type(() => ComponentStylesDto)
  styles!: ComponentStylesDto;

  @ValidateNested()
  @Type(() => ComponentContentDto)
  content!: ComponentContentDto;

  @ValidateNested()
  @IsOptionalDecorator()
  @Type(() => AnimationConfigDto)
  animation?: AnimationConfigDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentNodeDto)
  @IsOptionalDecorator()
  children?: ComponentNodeDto[];
}

/**
 * 画布配置 DTO
 * 用于验证画布的基本配置参数
 *
 * 需求：11.2 - API 输入验证
 */
export class CanvasConfigDto {
  /**
   * 画布宽度（像素）
   * 范围：100-5000px
   */
  @IsNumber()
  @Min(100, { message: '画布宽度必须至少为 100px' })
  @Max(5000, { message: '画布宽度不能超过 5000px' })
  width!: number;

  /**
   * 画布高度（像素）
   * 范围：100-5000px
   */
  @IsNumber()
  @Min(100, { message: '画布高度必须至少为 100px' })
  @Max(5000, { message: '画布高度不能超过 5000px' })
  height!: number;

  /**
   * 画布预设类型
   * 可选值：mobile, tablet, desktop, custom
   */
  @IsString()
  @IsIn(['mobile', 'tablet', 'desktop', 'custom'], {
    message: '预设类型必须是 mobile, tablet, desktop 或 custom',
  })
  preset!: 'mobile' | 'tablet' | 'desktop' | 'custom';

  /**
   * 背景颜色（HEX 格式）
   * 格式：#RRGGBB
   */
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: '背景颜色必须是有效的 HEX 格式（例如：#FFFFFF）',
  })
  backgroundColor!: string;
}

/**
 * 创建项目 DTO
 * 用于验证创建项目时的请求体
 *
 * 需求：11.2 - API 输入验证
 */
export class CreateProjectDto {
  /**
   * 项目名称
   * 必填，最大长度 255 字符
   */
  @IsString({ message: '项目名称必须是字符串' })
  @IsNotEmpty({ message: '项目名称不能为空' })
  @MaxLength(255, { message: '项目名称不能超过 255 个字符' })
  name!: string;

  /**
   * 画布配置
   * 必填，包含宽度、高度、预设类型和背景色
   */
  @IsObject({ message: '画布配置必须是对象' })
  @ValidateNested({ message: '画布配置格式不正确' })
  @Type(() => CanvasConfigDto)
  canvasConfig!: CanvasConfigDto;

  /**
   * 组件树（DSL）
   * 必填，组件节点数组
   */
  @IsArray({ message: '组件树必须是数组' })
  @ValidateNested({ each: true, message: '组件树中的每个节点必须符合规范' })
  @Type(() => ComponentNodeDto)
  componentsTree!: ComponentNodeDto[];
}

/**
 * 更新项目 DTO
 * 用于验证更新项目时的请求体
 * 所有字段都是可选的，允许部分更新
 *
 * 需求：11.2 - API 输入验证
 */
export class UpdateProjectDto {
  /**
   * 项目名称（可选）
   * 最大长度 255 字符
   */
  @IsString({ message: '项目名称必须是字符串' })
  @IsOptional()
  @MaxLength(255, { message: '项目名称不能超过 255 个字符' })
  name?: string;

  /**
   * 画布配置（可选）
   * 包含宽度、高度、预设类型和背景色
   */
  @IsObject({ message: '画布配置必须是对象' })
  @IsOptional()
  @ValidateNested({ message: '画布配置格式不正确' })
  @Type(() => CanvasConfigDto)
  canvasConfig?: CanvasConfigDto;

  /**
   * 组件树（可选）
   * 组件节点数组
   */
  @IsArray({ message: '组件树必须是数组' })
  @IsOptional()
  @ValidateNested({ each: true, message: '组件树中的每个节点必须符合规范' })
  @Type(() => ComponentNodeDto)
  componentsTree?: ComponentNodeDto[];
}
