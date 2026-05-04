/**
 * antd-cascader 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdCascaderConfig: AntdComponentConfig = {
  type: 'antd-cascader',
  component: 'Cascader',
  material: {
    label: '级联选择',
    icon: 'antd:Cluster',
    iconSource: 'antd',
    description: '级联选择组件',
    backgroundColor: '#E6F7FF',
    category: 'inputs',
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
        {
          value: 'zhejiang',
          label: '浙江',
          children: [
            { value: 'hangzhou', label: '杭州' },
            { value: 'ningbo', label: '宁波' },
          ],
        },
        {
          value: 'jiangsu',
          label: '江苏',
          children: [
            { value: 'nanjing', label: '南京' },
            { value: 'suzhou', label: '苏州' },
          ],
        },
      ],
    },
    props: {
      disabled: false,
      expandTrigger: 'hover',
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '级联选择属性',
      properties: [
        {
          key: 'props.disabled',
          label: '禁用',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'props.expandTrigger',
          label: '展开触发方式',
          type: 'select',
          defaultValue: 'hover',
          options: [
            { value: 'hover', label: '悬浮' },
            { value: 'click', label: '点击' },
          ],
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
          defaultValue: JSON.stringify(
            [{ value: 'option1', label: '选项 1', children: [] }],
            null,
            2
          ),
          description: 'JSON 格式的级联选项数组',
        },
      ],
    },
  ],
};
