/**
 * Tag 标签组件定义
 */

import type { ComponentDefinition } from '../../store/componentRegistry';
import { generateVisualStyle } from './utils';

/**
 * Tag 标签组件定义
 */
export const tagDefinition: ComponentDefinition = {
  type: 'tag',
  material: {
    type: 'tag',
    label: '标签',
    icon: 'Tag',
    description: '标签组件',
    backgroundColor: '#fce7f3',
    starColor: '#ec4899',
    category: 'form',
  },
  defaults: {
    position: { x: 0, y: 0, width: 80, height: 28, zIndex: 0 },
    styles: {
      backgroundColor: '#F1F5F9',
      borderColor: '#CBD5E1',
      borderWidth: 1,
      borderRadius: 14,
      textColor: '#475569',
      fontSize: 12,
      fontWeight: 500,
    },
    content: { text: '标签' },
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
          defaultValue: '#F1F5F9',
        },
        {
          key: 'styles.textColor',
          label: '文字颜色',
          type: 'color',
          defaultValue: '#475569',
        },
        {
          key: 'styles.borderColor',
          label: '边框色',
          type: 'color',
          defaultValue: '#CBD5E1',
        },
        {
          key: 'styles.borderRadius',
          label: '圆角',
          type: 'number',
          defaultValue: 14,
          min: 0,
          max: 50,
          suffix: 'px',
        },
        {
          key: 'styles.fontSize',
          label: '字体大小',
          type: 'number',
          defaultValue: 12,
          min: 8,
          max: 32,
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
      ],
    },
    {
      id: 'content',
      label: '内容',
      properties: [
        {
          key: 'content.text',
          label: '标签文字',
          type: 'string',
          defaultValue: '标签',
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
      <div
        className="w-full h-full"
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={onClick}
      >
        {String(component.content.text || '标签')}
      </div>
    );
  },
  codeGen: {
    generateJSX: (component, style) => {
      const text = String(component.content.text || '标签');
      return `<span style={${style}}>${text}</span>`;
    },
  },
};
