/**
 * antd-treeselect 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdTreeSelectConfig: AntdComponentConfig = {
  type: 'antd-treeselect',
  component: 'TreeSelect',
  material: {
    label: '树形选择',
    icon: 'antd:NodeIndex',
    iconSource: 'antd',
    description: '树形选择组件',
    backgroundColor: '#F6FFED',
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
      treeData: [
        {
          value: 'parent1',
          title: '父节点 1',
          children: [
            { value: 'child1', title: '子节点 1-1' },
            { value: 'child2', title: '子节点 1-2' },
          ],
        },
        {
          value: 'parent2',
          title: '父节点 2',
          children: [{ value: 'child3', title: '子节点 2-1' }],
        },
      ],
    },
    props: {
      disabled: false,
      multiple: false,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '树形选择属性',
      properties: [
        {
          key: 'props.disabled',
          label: '禁用',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'props.multiple',
          label: '多选模式',
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
          key: 'content.treeData',
          label: '树形数据',
          type: 'string',
          defaultValue: JSON.stringify(
            [{ value: 'parent1', title: '父节点 1', children: [] }],
            null,
            2
          ),
          description: 'JSON 格式的树形数据数组',
        },
      ],
    },
  ],
};
