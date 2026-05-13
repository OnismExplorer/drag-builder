import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Layers } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: object) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string;
    };
  }
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const showToast = useUIStore(s => s.showToast);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string>('');

  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (siteKey && turnstileRef.current && window.turnstile) {
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        siteKey,
        callback: () => {},
        'error-callback': () => {},
        'expired-callback': () => {},
      });
    }
    return () => {
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetId.current);
      }
    };
  }, []);

  const handleSendCode = async () => {
    if (!email) {
      showToast('请输入邮箱', 'warning');
      return;
    }

    setSendingCode(true);
    try {
      const turnstileToken = window.turnstile?.getResponse(turnstileWidgetId.current) || '';
      await fetch('http://localhost:3000/auth/email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      });
      setCodeSent(true);
      showToast('验证码已发送', 'success');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'userMessage' in err
            ? (err as { userMessage: string }).userMessage
            : '发送验证码失败';
      showToast(msg, 'error');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username && !email) {
      showToast('至少填写用户名或邮箱', 'warning');
      return;
    }

    if (password.length < 8) {
      showToast('密码长度至少 8 个字符', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('两次密码输入不一致', 'warning');
      return;
    }

    if (!codeSent || !code) {
      showToast('请先发送并填写验证码', 'warning');
      return;
    }

    setLoading(true);

    try {
      // 先注册
      await register({
        username: username || undefined,
        email: email,
        password,
      });

      // 再验证邮箱
      const verifyRes = await fetch('http://localhost:3000/auth/email/register-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.message || '验证码验证失败');
      }

      const verifyData = await verifyRes.json();

      // 自动登录
      setAuth(verifyData.accessToken, verifyData.user);
      showToast('注册成功', 'success');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'userMessage' in err
            ? (err as { userMessage: string }).userMessage
            : '注册失败，请稍后重试';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-white">注册</h1>
          <p className="text-slate-400 mt-2">创建账号开始使用</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-5"
        >
          {/* 用户名 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
              用户名 <span className="text-slate-500 text-xs">（可选）</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
              placeholder="3-30 位字母、数字、下划线"
            />
          </div>

          {/* 邮箱 + 验证码 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              邮箱
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                placeholder="example@email.com"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode}
                className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm hover:bg-white/15 disabled:opacity-50"
              >
                {sendingCode ? '发送中...' : codeSent ? '重新发送' : '获取验证码'}
              </button>
            </div>
          </div>

          {/* 验证码 */}
          {codeSent && (
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-1.5">
                验证码
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
                placeholder="6 位数字验证码"
              />
            </div>
          )}

          {/* Turnstile */}
          <div ref={turnstileRef} className="flex justify-center" />

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
              autoComplete="new-password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
              placeholder="至少 8 个字符"
            />
          </div>

          {/* 确认密码 */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-300 mb-1.5"
            >
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
              placeholder="再次输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '注册中...' : '注册'}
          </button>

          <p className="text-center text-sm text-slate-400">
            已有账号？{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium">
              登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
