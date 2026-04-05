/**
 * ResponsiveGuard 组件
 * 当屏幕宽度小于 1280px 时，显示"请使用更大的屏幕"提示
 *
 * 需求：非功能性需求 - 兼容性
 */

import { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

const MIN_WIDTH = 1280;

/**
 * ResponsiveGuard 组件
 * 包裹子内容，在小屏幕上显示提示覆盖层
 */
export function ResponsiveGuard({ children }: { children: React.ReactNode }) {
  const [isTooSmall, setIsTooSmall] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsTooSmall(window.innerWidth < MIN_WIDTH);
    };

    check();

    let debounceTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(check, 200);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(debounceTimer);
    };
  }, []);

  if (!isTooSmall) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 mx-auto mb-6 bg-slate-800 rounded-2xl flex items-center justify-center">
          <Monitor className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight mb-3">请使用更大的屏幕</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          DragBuilder 编辑器需要至少 1280px 的屏幕宽度才能正常使用。 请在桌面端或更大的设备上访问。
        </p>
        <p className="mt-4 text-xs text-slate-600">
          当前宽度：{window.innerWidth}px / 最低要求：{MIN_WIDTH}px
        </p>
      </div>
    </div>
  );
}
