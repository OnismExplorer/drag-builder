/**
 * antd-inputnumber 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdInputNumberConfig: AntdComponentConfig = {
  type: 'antd-inputnumber',
  component: 'InputNumber',
  material: {
    label: '数字输入框',
    icon: 'antd:Number',
    iconSource: 'antd',
    description: '数字输入框组件',
    backgroundColor: '#F9F0FF',
    category: 'inputs',
  },
  defaults: {
    position: { x: 0, y: 0, width: 120, height: 40, zIndex: 0 },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
    },
    props: {
      min: 0,
      max: 100,
      step: 1,
      disabled: false,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '数字输入框属性',
      properties: [
        {
          key: 'props.min',
          label: '最小值',
          type: 'number',
          defaultValue: 0,
        },
        {
          key: 'props.max',
          label: '最大值',
          type: 'number',
          defaultValue: 100,
        },
        {
          key: 'props.step',
          label: '步进',
          type: 'number',
          defaultValue: 1,
          min: 0.1,
          max: 100,
        },
        {
          key: 'props.disabled',
          label: '禁用',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
};
