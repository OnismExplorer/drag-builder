/**
 * antd-input 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdInputConfig: AntdComponentConfig = {
  type: 'antd-input',
  component: 'Input',
  material: {
    label: '输入框',
    icon: 'antd:Edit',
    iconSource: 'antd',
    description: 'Ant Design 输入框组件',
    backgroundColor: '#F0F5FF',
    category: 'form',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 40, zIndex: 0 },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
    },
    content: { placeholder: '请输入...' },
    props: {
      size: 'middle',
      disabled: false,
      allowClear: true,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '输入框属性',
      properties: [
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
          key: 'props.allowClear',
          label: '可清除',
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
          key: 'content.placeholder',
          label: '占位符',
          type: 'string',
          defaultValue: '请输入...',
        },
      ],
    },
  ],
};
