/**
 * Button 按钮组件定义
 */

import type { ComponentDefinition } from '@store/componentRegistry';
import { generateVisualStyle, generateClassName } from './utils';

/**
 * Button 按钮组件定义
 */
export const buttonDefinition: ComponentDefinition = {
  type: 'button',
  material: {
    type: 'button',
    label: '按钮',
    icon: 'Box',
    description: '可点击按钮',
    backgroundColor: '#fef3c7',
    starColor: '#fbbf24',
    category: 'basic',
  },
  defaults: {
    position: { x: 0, y: 0, width: 120, height: 40, zIndex: 0 },
    styles: {
      backgroundColor: '#C2410C',
      borderColor: '#C2410C',
      borderWidth: 0,
      borderRadius: 8,
      textColor: '#FFFFFF',
      fontSize: 14,
      fontWeight: 500,
    },
    content: { text: '按钮' },
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
          defaultValue: '#C2410C',
        },
        {
          key: 'styles.textColor',
          label: '文字颜色',
          type: 'color',
          defaultValue: '#FFFFFF',
        },
        {
          key: 'styles.fontSize',
          label: '字体大小',
          type: 'number',
          defaultValue: 14,
          min: 8,
          max: 72,
          suffix: 'px',
        },
        {
          key: 'styles.fontWeight',
          label: '字重',
          type: 'number',
          defaultValue: 500,
          min: 100,
          max: 900,
          step: 100,
        },
        {
          key: 'styles.borderRadius',
          label: '圆角',
          type: 'number',
          defaultValue: 8,
          min: 0,
          max: 50,
          suffix: 'px',
        },
      ],
    },
    {
      id: 'content',
      label: '内容',
      properties: [
        {
          key: 'content.text',
          label: '按钮文字',
          type: 'string',
          defaultValue: '按钮',
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
    return (
      <button
        className="w-full h-full cursor-pointer transition-colors"
        style={style}
        onClick={onClick}
      >
        {String(component.content.text || '按钮')}
      </button>
    );
  },
  codeGen: {
    imports: [],
    generateJSX: (component, style, className) => {
      const cn = className ?? generateClassName(component);
      const text = String(component.content.text || '按钮');
      return `<button className="${cn}" style={${style}}>${text}</button>`;
    },
  },
};
