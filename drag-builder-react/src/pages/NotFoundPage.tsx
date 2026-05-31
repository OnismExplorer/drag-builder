import { Link } from 'react-router-dom';
import { Layers, Home } from 'lucide-react';

/**
 * NotFoundPage
 * 404 兜底页，访问不存在的路径时显示
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, #fb923c 0%, #fb923c 10%, #f97316 20%, #f97316 30%, #ea580c 40%, #ea580c 50%, #c2410c 60%, #c2410c 70%, #9a3412 80%, #9a3412 90%, #fb923c 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradient-wave 3s linear infinite',
              }}
            />
            <Layers className="relative z-10 w-6 h-6 text-white drop-shadow-md" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">DragBuilder</span>
        </div>

        {/* 404 Display */}
        <div className="mb-6">
          <span
            className="text-[120px] font-black text-transparent bg-clip-text bg-gradient-to-br from-orange-500 to-red-700 leading-none select-none"
            style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}
          >
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">页面不存在</h1>
        <p className="text-slate-400 mb-10 max-w-xs mx-auto">你访问的页面可能已被删除或地址有误</p>

        {/* 返回首页 */}
        <Link to="/">
          <button
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white
                       bg-orange-600 rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-900/40
                       transition-all hover:-translate-y-0.5 active:scale-95"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </Link>
      </div>
    </div>
  );
}
