import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { registerBuiltInComponents } from '@/components/built-in';

// 初始化组件注册表
registerBuiltInComponents();

// 注册 Ant Design 组件适配器
import { createAntDesignAdapter, preloadAntdComponents } from '@/components/adapters/antd';
import { componentRegistry } from '@/store/componentRegistry';
componentRegistry.registerAdapter(createAntDesignAdapter());

// 预加载 antd 组件以加快首次渲染
preloadAntdComponents();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
