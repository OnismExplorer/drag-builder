import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { registerBuiltInComponents } from './components/built-in';

// 初始化组件注册表
registerBuiltInComponents();

// 注意：Ant Design 适配器需要安装 antd 包后才能启用
// 然后在 src/main.tsx 中取消下面的注释:
import { createAntdAdapter } from './components/adapters/antd-adapter';
import { componentRegistry } from './store/componentRegistry.ts';
componentRegistry.registerAdapter(createAntdAdapter());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
