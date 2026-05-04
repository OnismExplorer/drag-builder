/**
 * antd-card 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdCardConfig: AntdComponentConfig = {
  type: 'antd-card',
  component: 'Card',
  material: {
    label: '卡片',
    icon: 'antd:CreditCard',
    iconSource: 'antd',
    description: '卡片组件',
    backgroundColor: '#FFF2E8',
    category: 'display',
  },
  defaults: {
    position: { x: 0, y: 0, width: 300, height: 200, zIndex: 0 },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
    },
    content: {
      title: '卡片标题',
      content: '卡片内容区域',
    },
    props: {
      bordered: true,
      hoverable: false,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '卡片属性',
      properties: [
        {
          key: 'props.bordered',
          label: '显示边框',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          key: 'props.hoverable',
          label: '悬浮效果',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      id: 'content',
      label: '内容',
      properties: [
        {
          key: 'content.title',
          label: '标题',
          type: 'string',
          defaultValue: '卡片标题',
        },
        {
          key: 'content.content',
          label: '内容',
          type: 'string',
          defaultValue: '卡片内容区域',
        },
      ],
    },
  ],
};
