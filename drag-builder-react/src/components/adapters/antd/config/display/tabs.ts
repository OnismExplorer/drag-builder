/**
 * antd-tabs 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdTabsConfig: AntdComponentConfig = {
  type: 'antd-tabs',
  component: 'Tabs',
  material: {
    label: '标签页',
    icon: 'antd:FolderOpen',
    iconSource: 'antd',
    description: '标签页组件',
    backgroundColor: '#E6F4FF',
    category: 'display',
  },
  defaults: {
    position: { x: 0, y: 0, width: 400, height: 200, zIndex: 0 },
    styles: {},
    content: {
      items: [
        { key: '1', label: '标签 1', children: '内容 1' },
        { key: '2', label: '标签 2', children: '内容 2' },
        { key: '3', label: '标签 3', children: '内容 3' },
      ],
    },
    props: {
      type: 'line',
      tabPosition: 'top',
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '标签页属性',
      properties: [
        {
          key: 'props.type',
          label: '风格',
          type: 'select',
          defaultValue: 'line',
          options: [
            { value: 'line', label: '线条' },
            { value: 'card', label: '卡片' },
            { value: 'editable-card', label: '可编辑卡片' },
          ],
        },
        {
          key: 'props.tabPosition',
          label: '标签位置',
          type: 'select',
          defaultValue: 'top',
          options: [
            { value: 'top', label: '顶部' },
            { value: 'bottom', label: '底部' },
            { value: 'left', label: '左侧' },
            { value: 'right', label: '右侧' },
          ],
        },
      ],
    },
    {
      id: 'content',
      label: '内容',
      properties: [
        {
          key: 'content.items',
          label: '标签页配置',
          type: 'string',
          defaultValue: JSON.stringify(
            [
              { key: '1', label: '标签 1', children: '内容 1' },
              { key: '2', label: '标签 2', children: '内容 2' },
            ],
            null,
            2
          ),
          description: 'JSON 格式的标签页配置数组',
        },
      ],
    },
  ],
};
