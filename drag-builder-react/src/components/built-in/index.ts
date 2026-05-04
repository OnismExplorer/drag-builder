/**
 * Built-in 组件统一注册
 *
 * 在应用启动时调用此函数注册所有内置组件
 */

import { componentRegistry } from '@store/componentRegistry';
import { divDefinition } from './Div';
import { buttonDefinition } from './Button';
import { textDefinition } from './Text';
import { imageDefinition } from './Image';
import { inputDefinition } from './Input';
import { radioDefinition } from './Radio';
import { checkboxDefinition } from './Checkbox';
import { tagDefinition } from './Tag';

/**
 * 注册所有内置组件
 */
export function registerBuiltInComponents(): void {
  // 注册所有内置组件
  componentRegistry.registerMany([
    divDefinition,
    buttonDefinition,
    textDefinition,
    imageDefinition,
    inputDefinition,
    radioDefinition,
    checkboxDefinition,
    tagDefinition,
  ]);

  // 设置分类顺序
  componentRegistry.setCategoryOrder([
    { id: 'basic', name: '基础组件', order: 1 },
    { id: 'form', name: '表单组件', order: 2 },
    { id: 'inputs', name: '输入组件', order: 3 },
    { id: 'display', name: '展示组件', order: 4 },
    { id: 'antd', name: 'Ant Design', order: 5 },
    { id: 'custom', name: '自定义组件', order: 6 },
  ]);

  console.log(
    '[DragBuilder] Registered built-in components:',
    componentRegistry.getAll().map(d => d.type)
  );
}
