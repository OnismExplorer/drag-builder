/**
 * antd-avatar 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdAvatarConfig: AntdComponentConfig = {
  type: 'antd-avatar',
  component: 'Avatar',
  material: {
    label: '头像',
    icon: 'antd:User',
    iconSource: 'antd',
    description: '头像组件',
    backgroundColor: '#FFF0F6',
    category: 'display',
  },
  defaults: {
    position: { x: 0, y: 0, width: 50, height: 50, zIndex: 0 },
    styles: {},
    content: {
      src: '',
      alt: '头像',
    },
    props: {
      shape: 'circle',
      size: 40,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '头像属性',
      properties: [
        {
          key: 'props.shape',
          label: '形状',
          type: 'select',
          defaultValue: 'circle',
          options: [
            { value: 'circle', label: '圆形' },
            { value: 'square', label: '方形' },
          ],
        },
        {
          key: 'props.size',
          label: '尺寸',
          type: 'number',
          defaultValue: 40,
          min: 20,
          max: 200,
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
          defaultValue: '头像',
        },
      ],
    },
  ],
};
