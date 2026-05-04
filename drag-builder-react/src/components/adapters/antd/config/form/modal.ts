/**
 * antd-modal 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdModalConfig: AntdComponentConfig = {
  type: 'antd-modal',
  component: 'Modal',
  material: {
    label: '对话框',
    icon: 'antd:Windows',
    iconSource: 'antd',
    description: '对话框组件',
    backgroundColor: '#FFF7E6',
    category: 'form',
  },
  defaults: {
    position: { x: 0, y: 0, width: 520, height: 300, zIndex: 0 },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
    },
    content: {
      title: '弹窗标题',
      content: '弹窗内容',
    },
    props: {
      open: false,
      width: 520,
      closable: true,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '对话框属性',
      properties: [
        {
          key: 'props.open',
          label: '默认打开',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'props.width',
          label: '宽度',
          type: 'number',
          defaultValue: 520,
          min: 200,
          max: 1000,
          suffix: 'px',
        },
        {
          key: 'props.closable',
          label: '显示关闭按钮',
          type: 'checkbox',
          defaultValue: true,
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
          defaultValue: '弹窗标题',
        },
        {
          key: 'content.content',
          label: '内容',
          type: 'string',
          defaultValue: '弹窗内容',
        },
      ],
    },
  ],
};
