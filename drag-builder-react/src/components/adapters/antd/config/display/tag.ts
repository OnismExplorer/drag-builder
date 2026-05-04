/**
 * antd-tag 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdTagConfig: AntdComponentConfig = {
  type: 'antd-tag',
  component: 'Tag',
  material: {
    label: '标签',
    icon: 'antd:Tag',
    iconSource: 'antd',
    description: '标签组件',
    backgroundColor: '#F9F0FF',
    category: 'display',
  },
  defaults: {
    position: { x: 0, y: 0, width: 80, height: 30, zIndex: 0 },
    styles: {},
    content: {
      text: '标签',
    },
    props: {
      color: 'blue',
      closable: false,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '标签属性',
      properties: [
        {
          key: 'props.color',
          label: '颜色',
          type: 'select',
          defaultValue: 'blue',
          options: [
            { value: 'default', label: '默认' },
            { value: 'primary', label: '主题色' },
            { value: 'success', label: '成功' },
            { value: 'processing', label: '进行中' },
            { value: 'error', label: '错误' },
            { value: 'warning', label: '警告' },
            { value: 'magenta', label: '赤色' },
            { value: 'red', label: '红色' },
            { value: 'volcano', label: '火山' },
            { value: 'orange', label: '橙色' },
            { value: 'gold', label: '金色' },
            { value: 'lime', label: '酸橙' },
            { value: 'green', label: '绿色' },
            { value: 'cyan', label: '青色' },
            { value: 'blue', label: '蓝色' },
            { value: 'purple', label: '紫色' },
          ],
        },
        {
          key: 'props.closable',
          label: '可关闭',
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
          key: 'content.text',
          label: '标签文字',
          type: 'string',
          defaultValue: '标签',
        },
      ],
    },
  ],
};
