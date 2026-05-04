/**
 * antd-alert 组件配置
 */

import type { AntdComponentConfig } from '@components/adapters/antd/shared/types';

export const antdAlertConfig: AntdComponentConfig = {
  type: 'antd-alert',
  component: 'Alert',
  material: {
    label: '警告提示',
    icon: 'antd:Alert',
    iconSource: 'antd',
    description: '警告提示组件',
    backgroundColor: '#FFF7E6',
    category: 'display',
  },
  defaults: {
    position: { x: 0, y: 0, width: 300, height: 60, zIndex: 0 },
    styles: {},
    content: {
      message: '提示信息',
      description: '',
    },
    props: {
      type: 'info',
      closable: false,
    },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '警告提示属性',
      properties: [
        {
          key: 'props.type',
          label: '类型',
          type: 'select',
          defaultValue: 'info',
          options: [
            { value: 'success', label: '成功' },
            { value: 'info', label: '信息' },
            { value: 'warning', label: '警告' },
            { value: 'error', label: '错误' },
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
          key: 'content.message',
          label: '消息',
          type: 'string',
          defaultValue: '提示信息',
        },
        {
          key: 'content.description',
          label: '描述',
          type: 'string',
          defaultValue: '',
        },
      ],
    },
  ],
};
