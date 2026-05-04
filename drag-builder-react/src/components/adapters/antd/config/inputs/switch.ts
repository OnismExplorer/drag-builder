/**
 * antd-switch 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdSwitchConfig: AntdComponentConfig = {
  type: 'antd-switch',
  component: 'Switch',
  material: {
    label: '开关',
    icon: 'antd:Switcher',
    iconSource: 'antd',
    description: '开关组件',
    backgroundColor: '#FFF2E8',
    category: 'inputs',
  },
  defaults: {
    position: { x: 0, y: 0, width: 50, height: 30, zIndex: 0 },
    styles: {},
    props: {
      checked: false,
      disabled: false,
      size: 'default',
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '开关属性',
      properties: [
        {
          key: 'props.checked',
          label: '默认状态',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'props.disabled',
          label: '禁用',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'props.size',
          label: '尺寸',
          type: 'select',
          defaultValue: 'default',
          options: [
            { value: 'default', label: '默认' },
            { value: 'small', label: '小' },
          ],
        },
      ],
    },
  ],
};
