// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // 忽略构建产物
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  // 使用类型检查的推荐规则，适合 NestJS
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      // 修改为 module，匹配 NestJS 11 和现代 TS
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // 强制 AI 减少使用 any
      '@typescript-eslint/no-explicit-any': 'warn',
      // 强制处理 Promise
      '@typescript-eslint/no-floating-promises': 'error',
      // 限制不安全参数
      '@typescript-eslint/no-unsafe-argument': 'warn',
      // 开启 Prettier 校验
      'prettier/prettier': 'error',
      // 关闭一些 NestJS 依赖注入时常见的误报
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  // Jest 测试文件特殊配置
  {
    files: ['test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    rules: {
      // Jest mock 对象不需要检查 unbound-method
      '@typescript-eslint/unbound-method': 'off',
      // Jest 测试中的 async 函数允许没有 await (用于 setup/teardown)
      '@typescript-eslint/require-await': 'off',
    },
  },
  // Integration 测试文件特殊配置（允许 any 用于验证测试）
  {
    files: ['test/integration/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  // Prettier 放在最后
  eslintPluginPrettierRecommended,
);
