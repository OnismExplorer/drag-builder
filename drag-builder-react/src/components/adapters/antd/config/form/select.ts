/**
 * antd-select 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdSelectConfig: AntdComponentConfig = {
  type: 'antd-select',
  component: 'Select',
  material: {
    label: '下拉选择',
    icon: 'antd:Select',
    iconSource: 'antd',
    description: '下拉选择组件',
    backgroundColor: '#F6FFED',
    category: 'form',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 40, zIndex: 0 },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
    },
    content: {
      placeholder: '请选择',
      options: [
        { value: 'option1', label: '选项 1' },
        { value: 'option2', label: '选项 2' },
        { value: 'option3', label: '选项 3' },
      ],
    },
    props: {
      mode: undefined,
      disabled: false,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '选择器属性',
      properties: [
        {
          key: 'props.mode',
          label: '模式',
          type: 'select',
          defaultValue: undefined,
          options: [
            { value: '', label: '单选' },
            { value: 'multiple', label: '多选' },
            { value: 'tags', label: '标签' },
          ],
        },
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
      label: '内容',
      properties: [
        {
          key: 'content.placeholder',
          label: '占位符',
          type: 'string',
          defaultValue: '请选择',
        },
        {
          key: 'content.options',
          label: '选项列表',
          type: 'string',
          defaultValue: '[{ value: "option1", label: "选项 1" }]',
          description: 'JSON 格式的选项数组',
        },
      ],
    },
  ],
};
