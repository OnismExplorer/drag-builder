import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Layers, MousePointer, Code } from 'lucide-react';

/**
 * 未登录用户看到的首页 - Landing Page
 */
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-orange-600" />
          <span className="font-bold text-lg text-gray-900">DragBuilder</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-600 hover:text-gray-900">
            登录
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            开始使用
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            快速构建你的
            <span className="text-orange-600">网页应用</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            拖拽式页面构建器，无需编码即可创建精美的 React 页面
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 bg-orange-600 text-white text-lg rounded-lg hover:bg-orange-700"
            >
              立即体验
            </Link>
            <a
              href="#features"
              className="px-8 py-3 bg-white text-gray-700 border border-gray-300 text-lg rounded-lg hover:bg-gray-50"
            >
              了解更多
            </a>
          </div>
        </div>

        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <MousePointer className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">拖拽设计</h3>
            <p className="text-gray-600">直观的拖拽界面，轻松移动和调整组件位置</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Layers className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">实时预览</h3>
            <p className="text-gray-600">所见即所得，实时查看页面效果</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Code className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">代码导出</h3>
            <p className="text-gray-600">一键导出 React 代码，可直接用于生产环境</p>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * 已登录用户看到的首页 - Dashboard
 */
function DashboardPage() {
  const logout = useAuthStore(s => s.logout);
  const user = useAuthStore(s => s.user);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-orange-600" />
            <span className="font-bold text-lg text-gray-900">DragBuilder</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.displayName || user?.username || user?.email}
            </span>
            <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">欢迎回来！</h2>
          <p className="text-gray-600 mb-6">你的项目列表将显示在这里</p>
          <Link
            to="/editor"
            className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            打开编辑器
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function HomePage() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <DashboardPage />;
}
