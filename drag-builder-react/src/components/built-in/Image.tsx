/**
 * Image 图片组件定义
 */

import type { ComponentDefinition } from '../../store/componentRegistry';
import { generateVisualStyle } from './utils';
import { getSafeImageUrl } from '../../utils/sanitization';

/**
 * Image 图片组件定义
 */
export const imageDefinition: ComponentDefinition = {
  type: 'image',
  material: {
    type: 'image',
    label: '图片',
    icon: 'Image',
    description: '图片组件',
    backgroundColor: '#ecfdf5',
    starColor: '#34d399',
    category: 'basic',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 200, zIndex: 0 },
    styles: {
      backgroundColor: '#F1F5F9',
      borderRadius: 8,
    },
    content: { src: '', alt: '图片' },
  },
  propertyGroups: [
    {
      id: 'style',
      label: '样式',
      properties: [
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
          key: 'content.src',
          label: '图片地址',
          type: 'string',
          defaultValue: '',
        },
        {
          key: 'content.alt',
          label: '替代文本',
          type: 'string',
          defaultValue: '图片',
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
      <img
        src={getSafeImageUrl(component.content.src)}
        alt={String(component.content.alt || '图片')}
        className="w-full h-full"
        style={{ ...style, objectFit: 'cover' }}
        onClick={onClick}
      />
    );
  },
  codeGen: {
    generateJSX: (component, style) => {
      const src = String(component.content.src || '/placeholder.png');
      const alt = String(component.content.alt || '');
      return `<img src="${src}" alt="${alt}" className="w-full h-full" style={{ ...${style}, objectFit: 'cover' }} />`;
    },
  },
};
