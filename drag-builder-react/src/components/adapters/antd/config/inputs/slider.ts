/**
 * antd-slider 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdSliderConfig: AntdComponentConfig = {
  type: 'antd-slider',
  component: 'Slider',
  material: {
    label: '滑动条',
    icon: 'antd:Sliders',
    iconSource: 'antd',
    description: '滑动条组件',
    backgroundColor: '#FFF7E6',
    category: 'inputs',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 40, zIndex: 0 },
    styles: {},
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
      label: '滑动条属性',
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
          min: 1,
          max: 50,
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
