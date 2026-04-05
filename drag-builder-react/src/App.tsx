/**
 * DragBuilder 主应用组件
 * 配置路由：/ (首页), /editor (编辑器), /test (拖拽测试)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CanvasSizeModal, Toast } from './components';
import EditorPage from './pages/EditorPage';
import HomePage from './pages/HomePage';
import { ResponsiveGuard } from './components/ResponsiveGuard/ResponsiveGuard';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { useApiErrorHandler } from './hooks/useApiErrorHandler';

/**
 * App 根组件
 * 配置路由系统
 */
function App() {
  // 初始化全局 API 错误处理器
  useApiErrorHandler();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* 首页路由 */}
          <Route path="/" element={<HomePage />} />

          {/* 编辑器路由 - 需要较大屏幕 */}
          <Route
            path="/editor"
            element={
              <ResponsiveGuard>
                <EditorPage />
              </ResponsiveGuard>
            }
          />
        </Routes>

        {/* 全局组件 */}
        <CanvasSizeModal />
        <Toast />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
