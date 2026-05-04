/**
 * antd-progress 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdProgressConfig: AntdComponentConfig = {
  type: 'antd-progress',
  component: 'Progress',
  material: {
    label: '进度条',
    icon: 'antd:Sync',
    iconSource: 'antd',
    description: '进度条组件',
    backgroundColor: '#F0F5FF',
    category: 'display',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 20, zIndex: 0 },
    styles: {},
    content: {},
    props: {
      percent: 50,
      strokeColor: '#1677ff',
      size: 'default',
      status: undefined,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '进度条属性',
      properties: [
        {
          key: 'props.percent',
          label: '百分比',
          type: 'number',
          defaultValue: 50,
          min: 0,
          max: 100,
          suffix: '%',
        },
        {
          key: 'props.strokeColor',
          label: '进度条颜色',
          type: 'color',
          defaultValue: '#1677ff',
        },
        {
          key: 'props.size',
          label: '尺寸',
          type: 'select',
          defaultValue: 'default',
          options: [
            { value: 'small', label: '小' },
            { value: 'default', label: '默认' },
          ],
        },
        {
          key: 'props.status',
          label: '状态',
          type: 'select',
          defaultValue: undefined,
          options: [
            { value: '', label: '正常' },
            { value: 'success', label: '成功' },
            { value: 'exception', label: '异常' },
            { value: 'active', label: '进行中' },
          ],
        },
      ],
    },
  ],
};
