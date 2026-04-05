/**
 * Ant Design 组件适配器
 * 提供 antd-button 和 antd-input 组件定义
 *
 * 注意：此适配器需要安装 antd 包才能正常工作
 * 当 antd 未安装时，组件将显示为占位符
 */

import React from 'react';
import type {
  ComponentAdapter,
  ComponentDefinition,
  RenderProps,
} from '../../store/componentRegistry';

/**
 * Button 组件属性
 */
interface ButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'danger' | 'link';
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  loading?: boolean;
  backgroundColor?: string;
}

/**
 * Input 组件属性
 */
interface InputProps {
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  allowClear?: boolean;
  backgroundColor?: string;
}

/**
 * 预加载的 Ant Design 模块缓存
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let antdModule: any = null;

/**
 * 预加载 antd 组件（当 antd 安装后调用此函数）
 */
const preloadAntd = async (): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const antd = await import(/* @vite-ignore */ 'antd' as any);
  antdModule = antd.default || antd;
};

/**
 * 获取 antd 模块（同步，如果未预加载则返回 undefined）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAntdModule = (): any => {
  return antdModule;
};

/**
 * Button 组件渲染函数
 */
const renderAntdButton = (props: RenderProps): React.ReactNode => {
  const { component } = props;
  const buttonProps = (component.props || {}) as ButtonProps;
  const antd = getAntdModule();

  if (!antd?.Button) {
    // 预加载未完成或 antd 未安装，显示占位符
    return (
      <div
        className="flex items-center justify-center w-full h-full bg-slate-100 border border-slate-300 rounded cursor-pointer"
        style={{ backgroundColor: buttonProps.backgroundColor || '#f5f5f5' }}
      >
        <span className="text-slate-500 text-sm">按钮</span>
      </div>
    );
  }

  const { Button } = antd;
  return (
    <Button
      type={buttonProps.type || 'default'}
      size={buttonProps.size || 'middle'}
      disabled={buttonProps.disabled}
      className="antd-button"
    >
      {String(component.content?.text || '按钮')}
    </Button>
  );
};

/**
 * Input 组件渲染函数
 */
const renderAntdInput = (props: RenderProps): React.ReactNode => {
  const { component } = props;
  const inputProps = (component.props || {}) as InputProps;
  const antd = getAntdModule();

  if (!antd?.Input) {
    // 预加载未完成或 antd 未安装，显示占位符
    return (
      <div
        className="flex items-center justify-center w-full h-full bg-slate-100 border border-slate-300 rounded"
        style={{ backgroundColor: inputProps.backgroundColor || '#ffffff' }}
      >
        <span className="text-slate-400 text-sm">
          {String(inputProps.placeholder || '请输入...')}
        </span>
      </div>
    );
  }

  const { Input } = antd;
  return (
    <Input
      placeholder={String(inputProps.placeholder || '请输入...')}
      size={inputProps.size || 'middle'}
      disabled={inputProps.disabled}
      allowClear={inputProps.allowClear}
      className="antd-input"
    />
  );
};

/**
 * Ant Design Button 定义
 */
const antdButtonDefinition: ComponentDefinition = {
  type: 'antd-button',
  material: {
    type: 'antd-button',
    label: '按钮',
    icon: 'Button',
    description: 'Ant Design 按钮组件',
    backgroundColor: '#FFFFFF',
    category: 'antd',
  },
  defaults: {
    position: { x: 0, y: 0, width: 120, height: 40, zIndex: 0 },
    styles: {
      backgroundColor: '#1677ff',
      borderColor: '#1677ff',
      borderWidth: 0,
      borderRadius: 6,
      textColor: '#ffffff',
      fontSize: 14,
    },
    content: { text: '按钮' },
    props: { type: 'primary', size: 'middle', disabled: false },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '按钮属性',
      properties: [
        {
          key: 'props.type',
          label: '类型',
          type: 'select',
          defaultValue: 'primary',
          options: [
            { value: 'primary', label: '主要按钮' },
            { value: 'default', label: '默认按钮' },
            { value: 'dashed', label: '虚线按钮' },
            { value: 'danger', label: '危险按钮' },
            { value: 'link', label: '链接按钮' },
          ],
        },
        {
          key: 'props.size',
          label: '尺寸',
          type: 'select',
          defaultValue: 'middle',
          options: [
            { value: 'small', label: '小' },
            { value: 'middle', label: '中' },
            { value: 'large', label: '大' },
          ],
        },
        {
          key: 'props.disabled',
          label: '禁用',
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
          label: '按钮文字',
          type: 'string',
          defaultValue: '按钮',
        },
      ],
    },
  ],
  render: renderAntdButton,
  codeGen: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateJSX: (component, _style, _className) => {
      const props = component.props || {};
      const type = props.type || 'primary';
      const size = props.size || 'middle';
      const disabled = props.disabled ? ' disabled' : '';
      const text = component.content?.text || '按钮';

      return `<Button type="${type}" size="${size}"${disabled}>
  ${text}
</Button>`;
    },
  },
};

/**
 * Ant Design Input 定义
 */
const antdInputDefinition: ComponentDefinition = {
  type: 'antd-input',
  material: {
    type: 'antd-input',
    label: '输入框',
    icon: 'Input',
    description: 'Ant Design 输入框组件',
    backgroundColor: '#FFFFFF',
    category: 'antd',
  },
  defaults: {
    position: { x: 0, y: 0, width: 200, height: 40, zIndex: 0 },
    styles: {
      backgroundColor: '#ffffff',
      borderColor: '#d9d9d9',
      borderWidth: 1,
      borderRadius: 6,
    },
    content: { placeholder: '请输入...' },
    props: { size: 'middle', disabled: false, allowClear: true },
  },
  propertyGroups: [
    {
      id: 'props',
      label: '输入框属性',
      properties: [
        {
          key: 'props.size',
          label: '尺寸',
          type: 'select',
          defaultValue: 'middle',
          options: [
            { value: 'small', label: '小' },
            { value: 'middle', label: '中' },
            { value: 'large', label: '大' },
          ],
        },
        {
          key: 'props.disabled',
          label: '禁用',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          key: 'props.allowClear',
          label: '可清除',
          type: 'checkbox',
          defaultValue: true,
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
          defaultValue: '请输入...',
        },
      ],
    },
  ],
  render: renderAntdInput,
  codeGen: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    generateJSX: (component, _style, _className) => {
      const props = component.props || {};
      const size = props.size || 'middle';
      const disabled = props.disabled ? ' disabled' : '';
      const allowClear = props.allowClear ? ' allowClear' : '';
      const placeholder = component.content?.placeholder || '请输入...';

      return `<Input placeholder="${placeholder}" size="${size}"${disabled}${allowClear} />`;
    },
  },
};

/**
 * 创建 Ant Design 适配器
 * @returns ComponentAdapter 包含所有 antd 组件定义
 */
export const createAntdAdapter = (): ComponentAdapter => {
  return {
    namespace: 'antd',
    components: {
      'antd-button': antdButtonDefinition,
      'antd-input': antdInputDefinition,
    },
  };
};

/**
 * 预加载 antd 组件（加快首次渲染）
 * 仅在 antd 已安装时有效
 */
export const preloadAntdComponents = async (): Promise<void> => {
  await preloadAntd();
};

export default createAntdAdapter;
