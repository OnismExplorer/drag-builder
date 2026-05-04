/**
 * antd-datepicker 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdDatePickerConfig: AntdComponentConfig = {
  type: 'antd-datepicker',
  component: 'DatePicker',
  material: {
    label: '日期选择器',
    icon: 'antd:Calendar',
    iconSource: 'antd',
    description: '日期选择组件',
    backgroundColor: '#FFF0F6',
    category: 'form',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 40, zIndex: 0 },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
    },
    content: { placeholder: '请选择日期' },
    props: {
      picker: 'date',
      disabled: false,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '日期选择器属性',
      properties: [
        {
          key: 'props.picker',
          label: '选择器类型',
          type: 'select',
          defaultValue: 'date',
          options: [
            { value: 'date', label: '日期' },
            { value: 'week', label: '周' },
            { value: 'month', label: '月' },
            { value: 'quarter', label: '季度' },
            { value: 'year', label: '年' },
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
          defaultValue: '请选择日期',
        },
      ],
    },
  ],
};
