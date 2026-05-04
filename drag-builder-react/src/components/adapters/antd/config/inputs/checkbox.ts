/**
 * antd-checkbox 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdCheckboxConfig: AntdComponentConfig = {
  type: 'antd-checkbox',
  component: 'Checkbox',
  material: {
    label: '多选框',
    icon: 'antd:CheckSquare',
    iconSource: 'antd',
    description: '多选框组件',
    backgroundColor: '#E6FFFB',
    category: 'inputs',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 100, zIndex: 0 },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
      padding: 12,
    },
    content: {
      options: [
        { value: 'option1', label: '选项 1', checked: false },
        { value: 'option2', label: '选项 2', checked: false },
        { value: 'option3', label: '选项 3', checked: false },
      ],
    },
    props: {
      disabled: false,
      layout: 'horizontal',
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '多选框属性',
      properties: [
        {
          key: 'props.disabled',
          label: '禁用',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'props.layout',
          label: '布局',
          type: 'select',
          defaultValue: 'horizontal',
          options: [
            { value: 'horizontal', label: '水平' },
            { value: 'vertical', label: '垂直' },
          ],
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
              { value: 'option1', label: '选项 1', checked: false },
              { value: 'option2', label: '选项 2', checked: false },
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
