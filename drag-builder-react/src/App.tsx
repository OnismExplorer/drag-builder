/**
 * DragBuilder 主应用组件
 * 配置路由：/ (首页), /editor (编辑器), /test (拖拽测试)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CanvasSizeModal, Toast, AuthGuard } from '@/components';
import EditorPage from '@/pages/EditorPage';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import { ResponsiveGuard } from '@/components/ResponsiveGuard/ResponsiveGuard';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import { useApiErrorHandler } from '@/hooks/useApiErrorHandler';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

/**
 * App 根组件
 * 配置路由系统
 */
function App() {
  useApiErrorHandler();

  const loadFromStorage = useAuthStore(s => s.loadFromStorage);
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <AuthGuard>
                <HomePage />
              </AuthGuard>
            }
          />

          <Route
            path="/editor"
            element={
              <AuthGuard>
                <ResponsiveGuard>
                  <EditorPage />
                </ResponsiveGuard>
              </AuthGuard>
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
