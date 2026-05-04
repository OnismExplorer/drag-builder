/**
 * antd-button 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdButtonConfig: AntdComponentConfig = {
  type: 'antd-button',
  component: 'Button',
  material: {
    label: '按钮',
    icon: 'antd:PlusCircle',
    iconSource: 'antd',
    description: 'Ant Design 按钮组件',
    backgroundColor: '#E6F4FF',
    category: 'form',
  },
  defaults: {
    position: { x: 0, y: 0, width: 120, height: 40, zIndex: 0 },
    styles: {
      backgroundColor: '#1677ff',
      borderRadius: 6,
    },
    content: { text: '按钮' },
    props: {
      type: 'primary',
      size: 'middle',
      disabled: false,
      loading: false,
      danger: false,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '按钮属性',
      properties: [
        {
          key: 'props.type',
          label: '类型',
          type: 'select',
          defaultValue: 'primary',
          options: [
            { value: 'primary', label: '主要按钮' },
            { value: 'default', label: '默认按钮' },
            { value: 'dashed', label: '虚线按钮' },
            { value: 'danger', label: '危险按钮' },
            { value: 'link', label: '链接按钮' },
          ],
        },
        {
          key: 'props.size',
          label: '尺寸',
          type: 'select',
          defaultValue: 'middle',
          options: [
            { value: 'small', label: '小' },
            { value: 'middle', label: '中' },
            { value: 'large', label: '大' },
          ],
        },
        {
          key: 'props.disabled',
          label: '禁用',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'props.loading',
          label: '加载中',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'props.danger',
          label: '危险按钮',
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
          key: 'content.text',
          label: '按钮文字',
          type: 'string',
          defaultValue: '按钮',
        },
      ],
    },
    {
      id: 'triggers',
      label: '触发器',
      properties: [
        {
          key: 'props.triggers.onClick',
          label: '点击触发',
          type: 'string',
          defaultValue: '',
          description: '输入目标组件 ID，点击按钮时将触发该组件',
        },
      ],
    },
  ],
  supportsTriggers: true,
};
