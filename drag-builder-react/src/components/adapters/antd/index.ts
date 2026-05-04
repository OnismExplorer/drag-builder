/**
 * Ant Design 组件适配器
 *
 * 使用配置驱动方式注册所有 antd 组件
 *
 * 使用方式:
 * import { createAntdAdapter } from './adapters/antd';
 * import { componentRegistry } from './store/componentRegistry';
 * componentRegistry.registerAdapter(createAntdAdapter());
 */

// 导入所有组件配置
import { createAntdAdapter } from './shared/factory.tsx';
import { preloadAntdComponents } from './shared/factory.tsx';
import type { AntdComponentConfig } from './shared/types';

// 表单组件
import {
  antdButtonConfig,
  antdInputConfig,
  antdDatePickerConfig,
  antdSelectConfig,
  antdModalConfig,
  antdTableConfig,
} from './config/form';

// 输入组件
import {
  antdInputNumberConfig,
  antdSwitchConfig,
  antdCheckboxConfig,
  antdRadioConfig,
  antdSliderConfig,
  antdCascaderConfig,
  antdTreeSelectConfig,
} from './config/inputs';

// 展示组件
import {
  antdCardConfig,
  antdAvatarConfig,
  antdBadgeConfig,
  antdTagConfig,
  antdProgressConfig,
  antdAlertConfig,
  antdTabsConfig,
} from './config/display';

/**
 * 所有 antd 组件配置
 */
const ANTD_COMPONENTS: AntdComponentConfig[] = [
  // Phase 2: 高频业务组件
  antdButtonConfig,
  antdInputConfig,
  antdDatePickerConfig,
  antdSelectConfig,
  antdModalConfig,
  antdTableConfig,

  // Phase 3: 基础表单组件
  antdInputNumberConfig,
  antdSwitchConfig,
  antdCheckboxConfig,
  antdRadioConfig,
  antdSliderConfig,
  antdCascaderConfig,
  antdTreeSelectConfig,

  // Phase 4: 展示型组件
  antdCardConfig,
  antdAvatarConfig,
  antdBadgeConfig,
  antdTagConfig,
  antdProgressConfig,
  antdAlertConfig,
  antdTabsConfig,
];

/**
 * 创建 antd 适配器
 * 注册所有 antd 组件到 ComponentRegistry
 */
export const createAntDesignAdapter = () => {
  return createAntdAdapter(ANTD_COMPONENTS);
};

/**
 * 导出类型
 */
export type { AntdComponentConfig } from './shared/types';

/**
 * 导出配置（供外部使用）
 */
export {
  antdButtonConfig,
  antdInputConfig,
  antdDatePickerConfig,
  antdSelectConfig,
  antdModalConfig,
  antdTableConfig,
  antdInputNumberConfig,
  antdSwitchConfig,
  antdCheckboxConfig,
  antdRadioConfig,
  antdSliderConfig,
  antdCascaderConfig,
  antdTreeSelectConfig,
  antdCardConfig,
  antdAvatarConfig,
  antdBadgeConfig,
  antdTagConfig,
  antdProgressConfig,
  antdAlertConfig,
  antdTabsConfig,
};

/**
 * 预加载 antd 组件
 * 建议在应用启动时调用
 */
export { preloadAntdComponents };

/**
 * 默认导出
 */
export default createAntDesignAdapter;
