import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  // 1. 全局忽略
  { ignores: ['dist', 'node_modules', 'coverage'] },

  // 2. 基础 JS 推荐配置
  js.configs.recommended,

  // 3. TS 推荐配置（展开数组）
  ...tseslint.configs.recommended,

  // 4. React Hooks & Refresh 配置
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // 5. 项目自定义规则
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // 强制类型安全
      '@typescript-eslint/no-explicit-any': 'warn',
      // 这里的错误会直接反映 Prettier 的格式化问题
      'prettier/prettier': 'error',
    },
  },

  // 6. Prettier 集成（必须放在最后）
  eslintPluginPrettierRecommended
);
