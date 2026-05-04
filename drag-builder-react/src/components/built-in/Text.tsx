/**
 * Text 文本组件定义
 */

import type { ComponentDefinition } from '@store/componentRegistry';
import { generateVisualStyle } from './utils';

/**
 * Text 文本组件定义
 */
export const textDefinition: ComponentDefinition = {
  type: 'text',
  material: {
    type: 'text',
    label: '文本',
    icon: 'Type',
    description: '文本内容',
    backgroundColor: '#f3e8ff',
    starColor: '#a78bfa',
    category: 'basic',
  },
  defaults: {
    position: { x: 0, y: 0, width: 100, height: 24, zIndex: 0 },
    styles: {
      textColor: '#0F172A',
      fontSize: 16,
      fontWeight: 400,
    },
    content: { text: '文本内容' },
  },
  propertyGroups: [
    {
      id: 'style',
      label: '样式',
      properties: [
        {
          key: 'styles.textColor',
          label: '文字颜色',
          type: 'color',
          defaultValue: '#0F172A',
        },
        {
          key: 'styles.fontSize',
          label: '字体大小',
          type: 'number',
          defaultValue: 16,
          min: 8,
          max: 72,
          suffix: 'px',
        },
        {
          key: 'styles.fontWeight',
          label: '字重',
          type: 'number',
          defaultValue: 400,
          min: 100,
          max: 900,
          step: 100,
        },
      ],
    },
    {
      id: 'content',
      label: '内容',
      properties: [
        {
          key: 'content.text',
          label: '文本内容',
          type: 'string',
          defaultValue: '文本内容',
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
      <p className="w-full h-full m-0" style={style} onClick={onClick}>
        {String(component.content.text || '文本内容')}
      </p>
    );
  },
  codeGen: {
    imports: [],
    generateJSX: (component, style) => {
      const text = String(component.content.text || '文本内容');
      return `<p className="m-0" style={${style}}>${text}</p>`;
    },
  },
};
