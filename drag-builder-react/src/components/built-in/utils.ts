/**
 * Built-in 组件共享工具函数
 */

import type { ComponentNode } from '../../types';
import type { PropertyValue } from '../../store/componentRegistry';

/**
 * 生成视觉样式对象（不含定位属性）
 * 定位属性由 ComponentNode 的 Wrapper 统一处理
 */
export function generateVisualStyle(component: ComponentNode): Record<string, string | number> {
  const { styles } = component;

  const styleObj: Record<string, string | number> = {};

  if (styles.backgroundColor) {
    if (
      styles.backgroundColor.startsWith('linear-gradient') ||
      styles.backgroundColor.startsWith('rgba')
    ) {
      styleObj.background = styles.backgroundColor;
    } else {
      styleObj.backgroundColor = styles.backgroundColor;
    }
  }
  if (styles.borderColor) {
    styleObj.borderColor = styles.borderColor;
  }
  if (styles.borderWidth !== undefined) {
    styleObj.borderWidth = `${styles.borderWidth}px`;
    styleObj.borderStyle = 'solid';
  }
  if (styles.borderRadius !== undefined) {
    styleObj.borderRadius = `${styles.borderRadius}px`;
  }
  if (styles.textColor) {
    styleObj.color = styles.textColor;
  }
  if (styles.fontSize !== undefined) {
    styleObj.fontSize = `${styles.fontSize}px`;
  }
  if (styles.fontWeight !== undefined) {
    styleObj.fontWeight = styles.fontWeight;
  }
  if (styles.padding !== undefined) {
    styleObj.padding = `${styles.padding}px`;
  }
  if (styles.shadow) {
    const { x, y, blur, color } = styles.shadow;
    styleObj.boxShadow = `${x}px ${y}px ${blur}px ${color}`;
  }

  return styleObj;
}

/**
 * 生成内联样式对象（包含定位属性）
 * 用于代码生成等需要完整样式的场景
 */
export function generateInlineStyle(component: ComponentNode): Record<string, string | number> {
  const { position } = component;

  const styleObj: Record<string, string | number> = {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: `${position.width}px`,
    height: `${position.height}px`,
    zIndex: position.zIndex,
  };

  // 合并视觉样式
  const visualStyle = generateVisualStyle(component);
  Object.assign(styleObj, visualStyle);

  return styleObj;
}

/**
 * 生成 CSS 样式字符串
 */
export function generateCSSProperties(component: ComponentNode): string {
  const { styles, position } = component;
  const lines: string[] = [];

  lines.push(`  position: absolute;`);
  lines.push(`  left: ${position.x}px;`);
  lines.push(`  top: ${position.y}px;`);
  lines.push(`  width: ${position.width}px;`);
  lines.push(`  height: ${position.height}px;`);
  lines.push(`  z-index: ${position.zIndex};`);

  if (styles.backgroundColor) {
    lines.push(`  background-color: ${styles.backgroundColor};`);
  }
  if (styles.borderColor && styles.borderWidth !== undefined) {
    lines.push(`  border: ${styles.borderWidth}px solid ${styles.borderColor};`);
  }
  if (styles.borderRadius !== undefined) {
    lines.push(`  border-radius: ${styles.borderRadius}px;`);
  }
  if (styles.textColor) {
    lines.push(`  color: ${styles.textColor};`);
  }
  if (styles.fontSize !== undefined) {
    lines.push(`  font-size: ${styles.fontSize}px;`);
  }
  if (styles.fontWeight !== undefined) {
    lines.push(`  font-weight: ${styles.fontWeight};`);
  }
  if (styles.padding !== undefined) {
    lines.push(`  padding: ${styles.padding}px;`);
  }
  if (styles.shadow) {
    const { x, y, blur, color } = styles.shadow;
    lines.push(`  box-shadow: ${x}px ${y}px ${blur}px ${color};`);
  }

  return lines.join('\n');
}

/**
 * 生成 Tailwind 类名
 */
export function generateClassName(component: ComponentNode): string {
  const classes: string[] = [];

  if (component.type === 'button') {
    classes.push('cursor-pointer', 'transition-colors');
  }

  if (component.styles.borderRadius !== undefined) {
    const radius = component.styles.borderRadius;
    if (radius <= 4) classes.push('rounded');
    else if (radius <= 8) classes.push('rounded-lg');
    else if (radius <= 16) classes.push('rounded-2xl');
    else classes.push('rounded-3xl');
  }

  return classes.join(' ');
}

/**
 * 获取属性值（支持嵌套路径，如 content.text）
 */
export function getPropertyValue(component: ComponentNode, key: string): PropertyValue | undefined {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = component;

  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }

  return value as PropertyValue;
}

/**
 * 设置属性值（支持嵌套路径）
 */
export function setPropertyValue(
  component: ComponentNode,
  key: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  newValue: any
): Partial<ComponentNode> {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};

  if (parts.length === 1) {
    // 直接属性
    if (key === 'position') {
      return { position: { ...component.position, ...newValue } };
    }
    if (key === 'styles') {
      return { styles: { ...component.styles, ...newValue } };
    }
    if (key === 'content') {
      return { content: { ...component.content, ...newValue } };
    }
    if (key === 'animation') {
      return { animation: newValue as ComponentNode['animation'] };
    }
    if (key === 'props') {
      return { props: { ...component.props, ...newValue } };
    }
    return { [key]: newValue };
  }

  // 嵌套属性，如 content.text, props.type
  const [parent, child] = parts;
  if (parent === 'content') {
    return { content: { ...component.content, [child]: newValue } };
  }
  if (parent === 'styles') {
    return { styles: { ...component.styles, [child]: newValue } };
  }
  if (parent === 'position') {
    return { position: { ...component.position, [child]: newValue } };
  }
  if (parent === 'props') {
    return { props: { ...component.props, [child]: newValue } };
  }

  return result;
}
