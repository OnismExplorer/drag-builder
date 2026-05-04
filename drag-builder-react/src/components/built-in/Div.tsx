/**
 * Div 容器组件定义
 */

import type { ComponentDefinition } from '@store/componentRegistry';
import { generateVisualStyle, generateCSSProperties, generateClassName } from './utils';

/**
 * Div 容器组件定义
 */
export const divDefinition: ComponentDefinition = {
  type: 'div',
  material: {
    type: 'div',
    label: '容器',
    icon: 'Square',
    description: '通用容器组件',
    backgroundColor: '#f0f9ff',
    starColor: '#38bdf8',
    category: 'basic',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 100, zIndex: 0 },
    styles: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      borderRadius: 16,
    },
    content: {},
  },
  propertyGroups: [
    {
      id: 'style',
      label: '样式',
      properties: [
        {
          key: 'styles.backgroundColor',
          label: '背景色',
          type: 'color',
          defaultValue: '#FFFFFF',
        },
        {
          key: 'styles.borderColor',
          label: '边框色',
          type: 'color',
          defaultValue: '#E2E8F0',
        },
        {
          key: 'styles.borderWidth',
          label: '边框宽度',
          type: 'number',
          defaultValue: 1,
          min: 0,
          max: 10,
          suffix: 'px',
        },
        {
          key: 'styles.borderRadius',
          label: '圆角',
          type: 'number',
          defaultValue: 16,
          min: 0,
          max: 100,
          suffix: 'px',
        },
      ],
    },
    {
      id: 'animation',
      label: '动画配置',
      properties: [],
    },
  ],
  render: ({ component, onClick }) => {
    const style = generateVisualStyle(component);
    return <div className="w-full h-full" style={style} onClick={onClick} />;
  },
  codeGen: {
    imports: [],
    generateJSX: (component, style, className) => {
      const cn = className ?? generateClassName(component);
      return `<div className="${cn}" style={${style}} />`;
    },
    generateCSS: component => {
      return `.comp-${component.id} {
${generateCSSProperties(component)}
}`;
    },
  },
};
