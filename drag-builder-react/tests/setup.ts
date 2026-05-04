/**
 * 测试环境设置文件
 * 配置全局测试工具和扩展
 */

import '@testing-library/jest-dom';
import { registerBuiltInComponents } from '../src/components/built-in';

// 初始化组件注册表（修复 ComponentNode / MaterialPanel 等测试中组件类型未注册的问题）
registerBuiltInComponents();

// 为 Canvas 测试提供 ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
