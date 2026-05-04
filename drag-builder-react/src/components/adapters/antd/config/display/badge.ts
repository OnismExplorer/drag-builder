/**
 * antd-badge 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdBadgeConfig: AntdComponentConfig = {
  type: 'antd-badge',
  component: 'Badge',
  material: {
    label: '徽标',
    icon: 'antd:Crown',
    iconSource: 'antd',
    description: '徽标组件',
    backgroundColor: '#E6FFFB',
    category: 'display',
  },
  defaults: {
    position: { x: 0, y: 0, width: 50, height: 50, zIndex: 0 },
    styles: {},
    content: {},
    props: {
      count: 5,
      overflow: 99,
      dot: false,
      status: undefined,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '徽标属性',
      properties: [
        {
          key: 'props.count',
          label: '数量',
          type: 'number',
          defaultValue: 5,
          min: 0,
          max: 9999,
        },
        {
          key: 'props.overflow',
          label: '溢出数量',
          type: 'number',
          defaultValue: 99,
          min: 1,
        },
        {
          key: 'props.dot',
          label: '小红点模式',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'props.status',
          label: '状态点',
          type: 'select',
          defaultValue: undefined,
          options: [
            { value: '', label: '无' },
            { value: 'success', label: '成功' },
            { value: 'processing', label: '进行中' },
            { value: 'default', label: '默认' },
            { value: 'error', label: '错误' },
            { value: 'warning', label: '警告' },
          ],
        },
      ],
    },
  ],
};
