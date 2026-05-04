/**
 * Ant Design 图标映射表
 * 同步导入 @ant-design/icons 中实际使用的图标组件
 *
 * 使用方式:
 * - icon: 'antd:PlusCircle' → IconComponent: PlusCircleOutlined
 * - icon: 'antd:Calendar' → IconComponent: CalendarOutlined
 */

import {
  PlusCircleOutlined,
  EditOutlined,
  CalendarOutlined,
  SelectOutlined,
  TableOutlined,
  WindowsOutlined,
  NumberOutlined,
  SwitcherOutlined,
  CheckSquareOutlined,
  CheckCircleOutlined,
  SlidersOutlined,
  ClusterOutlined,
  NodeIndexOutlined,
  CreditCardOutlined,
  UserOutlined,
  CrownOutlined,
  TagOutlined,
  SyncOutlined,
  AlertOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  'antd:PlusCircle': PlusCircleOutlined,
  'antd:Edit': EditOutlined,
  'antd:Calendar': CalendarOutlined,
  'antd:Select': SelectOutlined,
  'antd:Table': TableOutlined,
  'antd:Windows': WindowsOutlined,
  'antd:Number': NumberOutlined,
  'antd:Switcher': SwitcherOutlined,
  'antd:CheckSquare': CheckSquareOutlined,
  'antd:CheckCircle': CheckCircleOutlined,
  'antd:Sliders': SlidersOutlined,
  'antd:Cluster': ClusterOutlined,
  'antd:NodeIndex': NodeIndexOutlined,
  'antd:CreditCard': CreditCardOutlined,
  'antd:User': UserOutlined,
  'antd:Crown': CrownOutlined,
  'antd:Tag': TagOutlined,
  'antd:Sync': SyncOutlined,
  'antd:Alert': AlertOutlined,
  'antd:FolderOpen': FolderOpenOutlined,
};

/**
 * 同步获取 antd 图标组件
 * @param iconName 图标名称 (如 'antd:Calendar')
 * @returns antd 图标组件，如果不存在则返回 undefined
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAntdIconSync = (iconName: string): React.ComponentType<any> | undefined => {
  return ICON_MAP[iconName];
};

/**
 * 判断图标名称是否为 antd 图标
 */
export const isAntdIcon = (iconName: string): boolean => {
  return iconName.startsWith('antd:');
};

/**
 * antd 组件对应的图标映射表
 * 用于物料配置
 */
export const ANTD_COMPONENT_ICONS: Record<string, string> = {
  // 高频业务组件
  'antd-button': 'antd:PlusCircle',
  'antd-input': 'antd:Edit',
  'antd-datepicker': 'antd:Calendar',
  'antd-select': 'antd:Select',
  'antd-table': 'antd:Table',
  'antd-modal': 'antd:Windows',

  // 基础表单组件
  'antd-inputnumber': 'antd:Number',
  'antd-switch': 'antd:Switcher',
  'antd-checkbox': 'antd:CheckSquare',
  'antd-radio': 'antd:CheckCircle',
  'antd-slider': 'antd:Sliders',
  'antd-cascader': 'antd:Cluster',
  'antd-treeselect': 'antd:NodeIndex',

  // 展示型组件
  'antd-card': 'antd:CreditCard',
  'antd-avatar': 'antd:User',
  'antd-badge': 'antd:Crown',
  'antd-tag': 'antd:Tag',
  'antd-progress': 'antd:Sync',
  'antd-alert': 'antd:Alert',
  'antd-tabs': 'antd:FolderOpen',
};
