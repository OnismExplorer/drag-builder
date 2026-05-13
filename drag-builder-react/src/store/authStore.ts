import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const TOKEN_KEY = 'drag_builder_token';
const USER_KEY = 'drag_builder_user';

// 同步从 localStorage 恢复状态（模块加载时执行）
function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function loadUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserInfo) : null;
  } catch {
    return null;
  }
}

// 初始化时同步恢复
const initialToken = loadToken();
const initialUser = loadUser();

export interface UserInfo {
  id: string;
  username: string | null;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthStore {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

function persistAuth(token: string, user: UserInfo) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore storage errors
  }
}

export const useAuthStore = create<AuthStore>()(
  immer(set => ({
    // 初始化时同步恢复登录状态（关键修复）
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!(initialToken && initialUser),

    setAuth: (token: string, user: UserInfo) => {
      persistAuth(token, user);
      set(state => {
        state.token = token;
        state.user = user;
        state.isAuthenticated = true;
      });
    },

    logout: () => {
      clearAuth();
      set(state => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      });
    },

    loadFromStorage: () => {
      const token = loadToken();
      const user = loadUser();
      if (token && user) {
        set(state => {
          state.token = token;
          state.user = user;
          state.isAuthenticated = true;
        });
      }
    },
  }))
);
