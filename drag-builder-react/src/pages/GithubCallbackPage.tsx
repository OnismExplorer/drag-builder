import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { githubExchange } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Layers } from 'lucide-react';

export default function GithubCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const showToast = useUIStore(s => s.showToast);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const code = searchParams.get('code');

  useEffect(() => {
    if (!code) {
      return;
    }

    let cancelled = false;

    githubExchange(code)
      .then(res => {
        if (cancelled) return;
        setAuth(res.accessToken, res.user);
        setStatus('success');
        showToast('登录成功', 'success');
        setTimeout(() => navigate('/', { replace: true }), 1000);
      })
      .catch(err => {
        if (cancelled) return;
        setStatus('error');
        const msg =
          err instanceof Error
            ? err.message
            : typeof err === 'object' && err && 'userMessage' in err
              ? (err as { userMessage: string }).userMessage
              : 'GitHub 登录失败';
        setErrorMessage(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [code, navigate, setAuth, showToast]);

  // Handle missing code at render time
  if (!code) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
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

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <div className="text-red-500 text-4xl mb-4">✗</div>
            <p className="text-red-400 mb-4">未收到授权码</p>
            <button
              onClick={() => navigate('/login')}
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              返回登录页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
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

        {status === 'loading' && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-400">正在处理登录...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <p className="text-green-400">登录成功！即将跳转...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <div className="text-red-500 text-4xl mb-4">✗</div>
            <p className="text-red-400 mb-4">{errorMessage}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              返回登录页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
