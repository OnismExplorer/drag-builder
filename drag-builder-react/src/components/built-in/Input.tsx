/**
 * Input 输入框组件定义
 */

import type { ComponentDefinition } from '../../store/componentRegistry';
import { generateVisualStyle } from './utils';

/**
 * Input 输入框组件定义
 */
export const inputDefinition: ComponentDefinition = {
  type: 'input',
  material: {
    type: 'input',
    label: '输入框',
    icon: 'Minus',
    description: '文本输入框',
    backgroundColor: '#fce7f3',
    starColor: '#f472b6',
    category: 'basic',
  },
  defaults: {
    position: { x: 0, y: 0, width: 240, height: 40, zIndex: 0 },
    styles: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      borderRadius: 8,
      textColor: '#0F172A',
      fontSize: 14,
      padding: 8,
    },
    content: { placeholder: '请输入内容' },
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
          max: 5,
          suffix: 'px',
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
        {
          key: 'styles.fontSize',
          label: '字体大小',
          type: 'number',
          defaultValue: 14,
          min: 8,
          max: 32,
          suffix: 'px',
        },
        {
          key: 'styles.padding',
          label: '内边距',
          type: 'number',
          defaultValue: 8,
          min: 0,
          max: 32,
          suffix: 'px',
        },
      ],
    },
    {
      id: 'content',
      label: '内容',
      properties: [
        {
          key: 'content.placeholder',
          label: '占位符',
          type: 'string',
          defaultValue: '请输入内容',
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
      <input
        type="text"
        placeholder={String(component.content.placeholder || '请输入内容')}
        className="w-full h-full"
        style={style}
        onClick={onClick}
      />
    );
  },
  codeGen: {
    generateJSX: (component, style) => {
      const placeholder = String(component.content.placeholder || '请输入内容');
      return `<input type="text" placeholder="${placeholder}" className="w-full h-full" style={${style}} />`;
    },
  },
};
