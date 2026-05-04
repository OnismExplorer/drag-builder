/**
 * antd-table 组件配置 (基础版)
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdTableConfig: AntdComponentConfig = {
  type: 'antd-table',
  component: 'Table',
  material: {
    label: '表格',
    icon: 'antd:Table',
    iconSource: 'antd',
    description: '表格组件（基础版）',
    backgroundColor: '#E6FFFB',
    category: 'form',
  },
  defaults: {
    position: { x: 0, y: 0, width: 600, height: 300, zIndex: 0 },
    styles: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
    },
    content: {
      columns: [
        { title: '列1', dataIndex: 'col1', key: 'col1' },
        { title: '列2', dataIndex: 'col2', key: 'col2' },
        { title: '列3', dataIndex: 'col3', key: 'col3' },
      ],
      dataSource: [
        { key: '1', col1: '数据1', col2: '数据2', col3: '数据3' },
        { key: '2', col1: '数据4', col2: '数据5', col3: '数据6' },
        { key: '3', col1: '数据7', col2: '数据8', col3: '数据9' },
      ],
    },
    props: {
      bordered: true,
      size: 'middle',
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '表格属性',
      properties: [
        {
          key: 'props.bordered',
          label: '显示边框',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          key: 'props.size',
          label: '尺寸',
          type: 'select',
          defaultValue: 'middle',
          options: [
            { value: 'small', label: '小' },
            { value: 'middle', label: '中' },
          ],
        },
      ],
    },
    {
      id: 'content',
      label: '内容',
      properties: [
        {
          key: 'content.columns',
          label: '列配置',
          type: 'string',
          defaultValue: JSON.stringify(
            [
              { title: '列1', dataIndex: 'col1', key: 'col1' },
              { title: '列2', dataIndex: 'col2', key: 'col2' },
            ],
            null,
            2
          ),
          description: 'JSON 格式的列配置数组',
        },
        {
          key: 'content.dataSource',
          label: '数据源',
          type: 'string',
          defaultValue: JSON.stringify([{ key: '1', col1: '数据1', col2: '数据2' }], null, 2),
          description: 'JSON 格式的数据数组',
        },
      ],
    },
  ],
};
