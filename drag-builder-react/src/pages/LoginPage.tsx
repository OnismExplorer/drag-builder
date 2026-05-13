import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { login } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Layers } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore(s => s.setAuth);
  const showToast = useUIStore(s => s.showToast);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail
        ? { email: identifier, password }
        : { username: identifier, password };

      const res = await login(payload);
      setAuth(res.accessToken, res.user);
      showToast('登录成功', 'success');
      navigate(redirect, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'userMessage' in err
            ? (err as { userMessage: string }).userMessage
            : '登录失败，请检查用户名和密码';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const res = await fetch('http://localhost:3000/auth/github');
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      showToast('无法连接 GitHub 登录服务', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
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
          <h1 className="text-2xl font-bold text-white">登录</h1>
          <p className="text-slate-400 mt-2">登录以管理你的项目</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-5"
        >
          {/* GitHub 登录按钮 */}
          <button
            type="button"
            onClick={handleGithubLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-white font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            使用 GitHub 登录
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-black px-4 text-sm text-slate-500 absolute">或</span>
          </div>

          {/* 用户名/邮箱 */}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-slate-300 mb-1.5">
              用户名或邮箱
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
              placeholder="输入用户名或邮箱"
            />
          </div>

          {/* 密码 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
              placeholder="输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-slate-400">
            还没有账号？{' '}
            <Link to="/register" className="text-orange-400 hover:text-orange-300 font-medium">
              注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
