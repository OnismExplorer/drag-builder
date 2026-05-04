/**
 * antd-radio 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdRadioConfig: AntdComponentConfig = {
  type: 'antd-radio',
  component: 'Radio',
  material: {
    label: '单选框',
    icon: 'antd:CheckCircle',
    iconSource: 'antd',
    description: '单选框组件',
    backgroundColor: '#F0F5FF',
    category: 'inputs',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 80, zIndex: 0 },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
      padding: 12,
    },
    content: {
      options: [
        { value: 'option1', label: '选项 1' },
        { value: 'option2', label: '选项 2' },
      ],
    },
    props: {
      disabled: false,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '单选框属性',
      properties: [
        {
          key: 'props.disabled',
          label: '禁用',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      id: 'content',
      label: '选项',
      properties: [
        {
          key: 'content.options',
          label: '选项列表',
          type: 'string',
          defaultValue: JSON.stringify(
            [
              { value: 'option1', label: '选项 1' },
              { value: 'option2', label: '选项 2' },
            ],
            null,
            2
          ),
          description: 'JSON 格式的选项数组',
        },
      ],
    },
  ],
};
