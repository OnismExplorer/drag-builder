/**
 * Ant Design 组件适配器工厂
 * 配置驱动方式批量注册 antd 组件
 */

import React from 'react';
import type { ComponentAdapter, ComponentDefinition, RenderProps } from '@store/componentRegistry';
import { useComponentStore } from '@store/componentStore';
import type { ComponentNode } from '@/types';
import type { AntdComponentConfig, AntdCategoryConfig } from './types';

// 预加载的 antd 模块缓存
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let antdModule: any = null;

/**
 * 预加载 antd 组件
 */
const preloadAntd = async (): Promise<void> => {
  if (antdModule) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const antd = await import(/* @vite-ignore */ 'antd' as any);
    antdModule = antd.default || antd;
  } catch (error) {
    console.warn('[AntDesign Adapter] Failed to load antd:', error);
  }
};

/**
 * 获取 antd 模块
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAntdModule = (): any => antdModule;

/**
 * 预设的 antd 图标缓存
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconCache: Record<string, any> = {};

/**
 * 获取 antd 图标组件
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAntdIcon = async (iconName: string): Promise<any | null> => {
  if (iconCache[iconName]) return iconCache[iconName];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icons = await import(/* @vite-ignore */ '@ant-design/icons' as any);
    const icon = icons[iconName];
    if (icon) {
      iconCache[iconName] = icon;
      return icon;
    }
  } catch {
    // icons not available
  }

  return null;
};

/**
 * 创建 antd 组件的渲染函数
 */
const createRenderFunction = (config: AntdComponentConfig) => {
  return (props: RenderProps): React.ReactNode => {
    const { component } = props;
    const antd = getAntdModule();
    const antdProps = (component.props || {}) as Record<string, unknown>;

    // 如果 antd 未加载，显示占位符
    if (!antd || !antd[config.component]) {
      return (
        <div
          className="flex items-center justify-center w-full h-full bg-slate-100 border border-slate-300 rounded cursor-pointer"
          style={{ backgroundColor: (antdProps.backgroundColor as string) || '#f5f5f5' }}
        >
          <span className="text-slate-500 text-sm">{config.material.label}</span>
        </div>
      );
    }

    const AntdComponent = antd[config.component];

    // 根据组件类型处理不同的渲染逻辑
    switch (config.type) {
      case 'antd-button':
        return renderButton(AntdComponent, component, props);

      case 'antd-input':
        return renderInput(AntdComponent, component);

      case 'antd-select':
        return renderSelect(AntdComponent, component);

      case 'antd-datepicker':
        return renderDatePicker(AntdComponent, component);

      case 'antd-modal':
        return renderModal(AntdComponent, component);

      case 'antd-switch':
        return renderSwitch(AntdComponent, component);

      case 'antd-checkbox':
        return renderCheckbox(AntdComponent, component);

      case 'antd-radio':
        return renderRadio(AntdComponent, component);

      case 'antd-inputnumber':
        return renderInputNumber(AntdComponent, component);

      case 'antd-slider':
        return renderSlider(AntdComponent, component);

      case 'antd-card':
        return renderCard(AntdComponent, component, props);

      case 'antd-tag':
        return renderTag(AntdComponent, component);

      case 'antd-progress':
        return renderProgress(AntdComponent, component);

      case 'antd-alert':
        return renderAlert(AntdComponent, component);

      case 'antd-tabs':
        return renderTabs(AntdComponent, component);

      case 'antd-avatar':
        return renderAvatar(AntdComponent, component);

      case 'antd-badge':
        return renderBadge(AntdComponent, component);

      default:
        return (
          <div className="flex items-center justify-center w-full h-full bg-slate-100 border border-slate-300 rounded">
            <span className="text-slate-500 text-sm">{config.material.label}</span>
          </div>
        );
    }
  };
};

// ============== 各组件渲染函数 ==============

const renderButton = (
  Button: React.ComponentType<unknown>,
  component: ComponentNode,
  props: RenderProps
) => {
  const btnProps = (component.props || {}) as Record<string, unknown>;

  const handleClick = (e: React.MouseEvent) => {
    // 保持画布选中行为
    props.onClick(e);

    // 处理触发器
    const targetId = (component.props?.triggers as { onClick?: string })?.onClick;
    if (targetId) {
      const target = useComponentStore.getState().getComponentById(targetId);
      if (target) {
        useComponentStore.getState().updateComponent(targetId, { props: { open: true } });
      } else {
        console.warn(`[Trigger] Target component "${targetId}" not found.`);
      }
    }
  };

  return (
    <Button
      type={(btnProps.type as string) || 'primary'}
      size={(btnProps.size as string) || 'middle'}
      disabled={btnProps.disabled as boolean}
      loading={btnProps.loading as boolean}
      danger={btnProps.danger as boolean}
      className="w-full h-full"
      onClick={handleClick}
    >
      {String(component.content?.text || '按钮')}
    </Button>
  );
};

const renderInput = (Input: React.ComponentType<unknown>, component: ComponentNode) => {
  const inputProps = (component.props || {}) as Record<string, unknown>;
  return (
    <Input
      placeholder={String(component.content?.placeholder || '请输入...')}
      size={(inputProps.size as string) || 'middle'}
      disabled={inputProps.disabled as boolean}
      allowClear={inputProps.allowClear as boolean}
      className="w-full"
    />
  );
};

const renderSelect = (Select: React.ComponentType<unknown>, component: ComponentNode) => {
  const selectProps = (component.props || {}) as Record<string, unknown>;
  const options = (component.content?.options as Array<{ value: string; label: string }>) || [
    { value: 'option1', label: '选项 1' },
    { value: 'option2', label: '选项 2' },
  ];
  return (
    <Select
      placeholder={String(component.content?.placeholder || '请选择')}
      mode={selectProps.mode as string}
      disabled={selectProps.disabled as boolean}
      options={options}
      className="w-full"
    />
  );
};

const renderDatePicker = (DatePicker: React.ComponentType<unknown>, component: ComponentNode) => {
  const dpProps = (component.props || {}) as Record<string, unknown>;
  return (
    <DatePicker
      picker={(dpProps.picker as string) || 'date'}
      disabled={dpProps.disabled as boolean}
      placeholder={String(component.content?.placeholder || '请选择日期')}
      className="w-full"
    />
  );
};

const renderModal = (Modal: React.ComponentType<unknown>, component: ComponentNode) => {
  const modalProps = (component.props || {}) as Record<string, unknown>;
  return (
    <Modal
      open={(modalProps.open as boolean) || false}
      title={String(component.content?.title || '弹窗标题')}
      width={(modalProps.width as number) || 520}
      closable={modalProps.closable !== false}
      className="w-full"
    >
      <div className="text-slate-600">{String(component.content?.content || '弹窗内容')}</div>
    </Modal>
  );
};

const renderSwitch = (Switch: React.ComponentType<unknown>, component: ComponentNode) => {
  const switchProps = (component.props || {}) as Record<string, unknown>;
  return (
    <Switch
      checked={switchProps.checked as boolean}
      disabled={switchProps.disabled as boolean}
      size={switchProps.size as string}
    />
  );
};

const renderCheckbox = (Checkbox: React.ComponentType<unknown>, component: ComponentNode) => {
  const cbProps = (component.props || {}) as Record<string, unknown>;
  const options = (component.content?.options as Array<{
    value: string;
    label: string;
    checked?: boolean;
  }>) || [
    { value: 'option1', label: '选项 1', checked: false },
    { value: 'option2', label: '选项 2', checked: false },
  ];
  return (
    <Checkbox.Group
      options={options}
      disabled={cbProps.disabled as boolean}
      layout={(cbProps.layout as string) || 'horizontal'}
    />
  );
};

const renderRadio = (Radio: React.ComponentType<unknown>, component: ComponentNode) => {
  const radioProps = (component.props || {}) as Record<string, unknown>;
  const options = (component.content?.options as Array<{ value: string; label: string }>) || [
    { value: 'option1', label: '选项 1' },
    { value: 'option2', label: '选项 2' },
  ];
  return <Radio.Group options={options} disabled={radioProps.disabled as boolean} />;
};

const renderInputNumber = (InputNumber: React.ComponentType<unknown>, component: ComponentNode) => {
  const inProps = (component.props || {}) as Record<string, unknown>;
  return (
    <InputNumber
      min={inProps.min as number}
      max={inProps.max as number}
      step={inProps.step as number}
      disabled={inProps.disabled as boolean}
      className="w-full"
    />
  );
};

const renderSlider = (Slider: React.ComponentType<unknown>, component: ComponentNode) => {
  const slProps = (component.props || {}) as Record<string, unknown>;
  return (
    <Slider
      min={(slProps.min as number) || 0}
      max={(slProps.max as number) || 100}
      step={(slProps.step as number) || 1}
      disabled={slProps.disabled as boolean}
      className="w-full"
    />
  );
};

const renderCard = (
  Card: React.ComponentType<unknown>,
  component: ComponentNode,
  props: RenderProps
) => {
  const cardProps = (component.props || {}) as Record<string, unknown>;
  return (
    <Card
      title={String(component.content?.title || '卡片标题')}
      bordered={cardProps.bordered !== false}
      hoverable={cardProps.hoverable as boolean}
      onClick={props.onClick}
    >
      <div className="text-slate-600">{String(component.content?.content || '卡片内容')}</div>
    </Card>
  );
};

const renderTag = (Tag: React.ComponentType<unknown>, component: ComponentNode) => {
  const tagProps = (component.props || {}) as Record<string, unknown>;
  return (
    <Tag color={(tagProps.color as string) || 'blue'} closable={tagProps.closable as boolean}>
      {String(component.content?.text || '标签')}
    </Tag>
  );
};

const renderProgress = (Progress: React.ComponentType<unknown>, component: ComponentNode) => {
  const progProps = (component.props || {}) as Record<string, unknown>;
  return (
    <Progress
      percent={(progProps.percent as number) || 50}
      strokeColor={progProps.strokeColor as string}
      size={progProps.size as string}
      status={progProps.status as string}
    />
  );
};

const renderAlert = (Alert: React.ComponentType<unknown>, component: ComponentNode) => {
  const alertProps = (component.props || {}) as Record<string, unknown>;
  return (
    <Alert
      type={(alertProps.type as string) || 'info'}
      message={String(component.content?.message || '提示信息')}
      description={String(component.content?.description || '')}
      closable={alertProps.closable as boolean}
      showIcon
    />
  );
};

const renderTabs = (Tabs: React.ComponentType<unknown>, component: ComponentNode) => {
  const tabProps = (component.props || {}) as Record<string, unknown>;
  const items = (component.content?.items as Array<{
    key: string;
    label: string;
    children?: string;
  }>) || [
    { key: '1', label: '标签 1', children: '内容 1' },
    { key: '2', label: '标签 2', children: '内容 2' },
  ];
  return <Tabs type={(tabProps.type as string) || 'line'} items={items} />;
};

const renderAvatar = (Avatar: React.ComponentType<unknown>, component: ComponentNode) => {
  const avatarProps = (component.props || {}) as Record<string, unknown>;
  return (
    <Avatar
      shape={(avatarProps.shape as string) || 'circle'}
      size={(avatarProps.size as number) || 40}
      src={String(component.content?.src || '')}
      alt={String(component.content?.alt || '头像')}
    />
  );
};

const renderBadge = (Badge: React.ComponentType<unknown>, component: ComponentNode) => {
  const badgeProps = (component.props || {}) as Record<string, unknown>;
  return (
    <Badge
      count={(badgeProps.count as number) || 0}
      overflow={(badgeProps.overflow as number) || 99}
      dot={badgeProps.dot as boolean}
      status={badgeProps.status as string}
    >
      <div className="w-8 h-8 bg-slate-200 rounded" />
    </Badge>
  );
};

/**
 * 创建 antd 组件定义
 */
const createComponentDefinition = (config: AntdComponentConfig): ComponentDefinition => {
  return {
    type: config.type,
    namespace: 'antd',
    material: {
      type: config.type,
      label: config.material.label,
      icon: config.material.icon,
      iconSource: config.material.iconSource || 'antd',
      description: config.material.description,
      backgroundColor: config.material.backgroundColor,
      starColor: config.material.starColor,
      category: config.material.category,
    },
    defaults: {
      position: config.defaults.position,
      styles: config.defaults.styles || {},
      content: config.defaults.content || {},
      props: config.defaults.props || {},
    },
    propertyGroups: config.propertyGroups,
    render: createRenderFunction(config),
    codeGen: {
      imports: config.codeGen?.imports || [`import { ${config.component} } from 'antd';`],
      generateJSX:
        config.codeGen?.generateJSX ||
        (component => {
          const componentProps = component.props || {};

          // 根据组件类型生成不同的 JSX
          switch (config.type) {
            case 'antd-button':
              return generateButtonJSX(component, componentProps);
            case 'antd-input':
              return generateInputJSX(component, componentProps);
            case 'antd-select':
              return generateSelectJSX(component, componentProps);
            case 'antd-datepicker':
              return generateDatePickerJSX(component, componentProps);
            case 'antd-modal':
              return generateModalJSX(component, componentProps);
            default:
              return generateDefaultJSX(config.component, component);
          }
        }),
    },
  };
};

// ============== 代码生成辅助函数 ==============

const generateButtonJSX = (component: ComponentNode, props: Record<string, unknown>): string => {
  const type = props.type || 'primary';
  const size = props.size || 'middle';
  const disabled = props.disabled ? ' disabled' : '';
  const loading = props.loading ? ' loading' : '';
  const danger = props.danger ? ' danger' : '';
  const text = component.content?.text || '按钮';

  const triggerComment = (props.triggers as { onClick?: string })?.onClick
    ? `// onClick triggers ${(props.triggers as { onClick?: string }).onClick}\n`
    : '';

  return `${triggerComment}<Button type="${type}" size="${size}"${disabled}${loading}${danger}>
  ${text}
</Button>`;
};

const generateInputJSX = (component: ComponentNode, props: Record<string, unknown>): string => {
  const size = props.size || 'middle';
  const disabled = props.disabled ? ' disabled' : '';
  const allowClear = props.allowClear ? ' allowClear' : '';
  const placeholder = component.content?.placeholder || '请输入...';

  return `<Input placeholder="${placeholder}" size="${size}"${disabled}${allowClear} />`;
};

const generateSelectJSX = (component: ComponentNode, props: Record<string, unknown>): string => {
  const mode = props.mode ? ` mode="${props.mode}"` : '';
  const disabled = props.disabled ? ' disabled' : '';
  const placeholder = component.content?.placeholder || '请选择';
  const options = (component.content?.options as Array<{ value: string; label: string }>) || [];

  const optionsStr =
    options.length > 0
      ? `\n    options={[\n      ${options.map(o => `{ value: '${o.value}', label: '${o.label}' }`).join(',\n      ')}\n    ]}`
      : '';

  return `<Select${mode}${disabled} placeholder="${placeholder}"${optionsStr}
  />`;
};

const generateDatePickerJSX = (
  component: ComponentNode,
  props: Record<string, unknown>
): string => {
  const picker = props.picker || 'date';
  const disabled = props.disabled ? ' disabled' : '';
  const placeholder = component.content?.placeholder || '请选择日期';

  return `<DatePicker picker="${picker}"${disabled} placeholder="${placeholder}" />`;
};

const generateModalJSX = (component: ComponentNode, props: Record<string, unknown>): string => {
  const open = props.open ? 'open' : '';
  const title = component.content?.title || '弹窗标题';
  const width = props.width || 520;
  const closable = props.closable !== false ? '' : ' closable={false}';
  const content = component.content?.content || '弹窗内容';

  return `<Modal ${open} title="${title}" width={${width}}${closable}>
  <p>${content}</p>
</Modal>`;
};

const generateDefaultJSX = (componentName: string, component: ComponentNode): string => {
  const styleStr = JSON.stringify(component.styles || {});
  return `<${componentName} style={${styleStr}} />`;
};

/**
 * 创建 Ant Design 适配器
 * @param configs 组件配置数组
 * @returns ComponentAdapter
 */
export const createAntdAdapter = (configs: AntdComponentConfig[]): ComponentAdapter => {
  const components: Record<string, ComponentDefinition> = {};

  for (const config of configs) {
    components[config.type] = createComponentDefinition(config);
  }

  return {
    namespace: 'antd',
    components,
  };
};

/**
 * 预设分类配置
 */
export const ANTD_CATEGORIES: AntdCategoryConfig[] = [
  { id: 'form', name: '表单组件', order: 1 },
  { id: 'inputs', name: '输入组件', order: 2 },
  { id: 'display', name: '展示组件', order: 3 },
];

/**
 * 预加载 antd 和 antd-icons
 */
export const preloadAntdComponents = async (): Promise<void> => {
  await Promise.all([preloadAntd(), getAntdIcon('CalendarOutlined')]);
};
