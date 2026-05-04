import { Link } from 'react-router-dom';
import { Code2, Layers, Sparkles, Zap } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import { FeatureCard } from '@components/FeatureCard';
import { PixelSnow } from '@components/PixelSnow';
import ProjectList from '@components/ProjectList/ProjectList';

export default function HomePage() {
  const { openCanvasSizeModal } = useUIStore();

  return (
    <div className="min-h-screen bg-black">
      {/* 1. 深色主区域：适配全屏高度 */}
      <div className="relative min-h-screen flex flex-col overflow-hidden">
        {/* 全局背景动画 - 确保绝对定位覆盖整个黑色容器 */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <PixelSnow
            color="#ffffff"
            flakeSize={0.01}
            minFlakeSize={1.25}
            pixelResolution={200}
            speed={0.8}
            depthFade={8}
            farPlane={20}
            brightness={0.8}
            gamma={0.4545}
            density={0.2}
            variant="snowflake"
            direction={125}
          />
        </div>
        {/* Header - 保持在顶部且不占用高度（absolute 或透明 sticky） */}
        <header className="relative z-50 border-b border-white/5 backdrop-blur-md top-0 bg-black/10">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-7xl">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="relative w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(90deg, #fb923c 0%, #fb923c 10%, #f97316 20%, #f97316 30%, #ea580c 40%, #ea580c 50%, #c2410c 60%, #c2410c 70%, #9a3412 80%, #9a3412 90%, #fb923c 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'gradient-wave 3s linear infinite',
                  }}
                />
                <Layers className="relative z-10 w-5 h-5 text-white drop-shadow-md" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">DragBuilder</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/editor">
                <button className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  我的项目
                </button>
              </Link>
              <button
                onClick={openCanvasSizeModal}
                className="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-900/40 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                创建新项目
              </button>
            </nav>
          </div>
        </header>
        {/* 主内容混合容器：使用 Flex-grow 自动填满 2K/4K 屏幕的高 */}
        <div className="relative z-10 flex-grow flex flex-col justify-center">
          {/* Hero Section - 动态纵向 Padding */}
          <section className="container mx-auto px-6 py-[7vh] text-center max-w-7xl">
            <div className="max-w-4xl mx-auto space-y-10">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] text-white tracking-tighter">
                拖拽式 React 页面
                <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  可视化开发工具
                </span>
              </h1>
              <p className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                像使用 Figma 一样设计 React
                页面，实时预览动画效果，一键导出生产级代码。无需配置，上手即用。
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center pt-6">
                <button
                  onClick={openCanvasSizeModal}
                  className="px-10 py-5 text-lg font-bold text-white bg-orange-600 rounded-2xl hover:bg-orange-700 transition-all hover:scale-105 flex items-center justify-center gap-3 shadow-2xl shadow-orange-600/30"
                >
                  <Sparkles className="w-6 h-6" />
                  立即开始
                </button>
                <Link to="/editor" className="contents">
                  <button className="px-10 py-5 text-lg font-bold text-slate-300 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-sm">
                    <Code2 className="w-6 h-6" />
                    查看项目
                  </button>
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section - 自动适应底部位置 */}
          <section className="container mx-auto px-6 pb-24 md:pb-30 max-w-8xl">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={Layers}
                title="可视化拖拽"
                description="直观的拖拽界面，支持网格对齐和智能辅助线"
                iconColor="text-orange-600"
                iconBgColor="bg-orange-600/10"
                borderColor="#ea580c"
                darkMode
              />
              <FeatureCard
                icon={Zap}
                title="实时预览"
                description="所见即所得，调整样式和动画效果实时渲染"
                iconColor="text-orange-500"
                iconBgColor="bg-orange-500/10"
                borderColor="#f97316"
                darkMode
              />
              <FeatureCard
                icon={Code2}
                title="代码导出"
                description="一键导出干净的 React 代码，支持 TS 和 Tailwind"
                iconColor="text-red-600"
                iconBgColor="bg-red-600/10"
                borderColor="#dc2626"
                darkMode
              />
              <FeatureCard
                icon={Sparkles}
                title="动画设计"
                description="内置丰富的动画预设，支持自定义缓动函数"
                iconColor="text-red-500"
                iconBgColor="bg-red-500/10"
                borderColor="#ef4444"
                darkMode
              />
            </div>
          </section>
        </div>
        {/* 2. 关键过渡层：使用相对屏幕比例的高度 (vh) */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[35vh] z-20 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 20%, rgba(15,23,42,0.3) 40%, rgba(71,85,105,0.4) 60%, rgba(226,232,240,0.7) 80%, white 100%)',
          }}
        />
      </div>

      {/* 3. 白色背景区：项目列表 + CTA & Footer */}
      <section className="relative z-30 bg-white -mt-[1px]">
        {/* 项目列表区域 */}
        <div className="border-b border-slate-100">
          <ProjectList />
        </div>

        <div className="container mx-auto px-6 py-24 lg:py-40 max-w-7xl">
          <div className="group p-10 md:p-20 rounded-[3rem] border border-slate-100 bg-slate-50 relative overflow-hidden transition-all hover:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.06)]">
            {/* 装饰背景动画 */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-orange-100/50 rounded-full blur-[120px] opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative z-10 text-center space-y-8">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
                准备好开启高效开发了吗？
              </h2>
              <p className="text-lg md:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
                加入我们，体验全新的 React 页面开发方式。让创意不受代码限制。
              </p>
              <div className="pt-6">
                <button
                  onClick={openCanvasSizeModal}
                  className="px-12 py-6 text-xl font-black text-white bg-orange-600 rounded-3xl hover:bg-orange-700 transition-all shadow-2xl shadow-orange-600/40 hover:scale-105 active:scale-95 inline-flex items-center gap-4"
                >
                  <Sparkles className="w-7 h-7" />
                  免费开始创建项目
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="bg-white border-t border-slate-100 py-16">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-slate-900 tracking-tight">DragBuilder</span>
              </div>
              <p className="text-sm text-slate-400 font-bold tracking-widest uppercase">
                © {new Date().getFullYear()} Drag, Drop, Deploy. The visual way to React.
              </p>
              <div className="flex gap-10 text-sm font-bold text-slate-500">
                <a href="#" className="hover:text-orange-600 transition-colors">
                  Twitter
                </a>
                <a href="#" className="hover:text-orange-600 transition-colors">
                  GitHub
                </a>
                <a href="#" className="hover:text-orange-600 transition-colors">
                  Docs
                </a>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}
