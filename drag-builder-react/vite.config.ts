import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const resolve = (p: string) => path.resolve(__dirname, p).replace(/\\/g, '/');

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      // 通用 src 别名（仅匹配 @/ 前缀，避免误匹配 @types 等 npm scope）
      { find: /^@\//, replacement: resolve('./src') + '/' },
      // 各模块别名（同时支持 @store 和 @store/xxx）
      { find: /^@api(\/|$)/, replacement: resolve('./src/api') + '$1' },
      { find: /^@assets(\/|$)/, replacement: resolve('./src/assets') + '$1' },
      { find: /^@components(\/|$)/, replacement: resolve('./src/components') + '$1' },
      { find: /^@hooks(\/|$)/, replacement: resolve('./src/hooks') + '$1' },
      { find: /^@pages(\/|$)/, replacement: resolve('./src/pages') + '$1' },
      { find: /^@store(\/|$)/, replacement: resolve('./src/store') + '$1' },
      { find: /^@utils(\/|$)/, replacement: resolve('./src/utils') + '$1' },
    ],
  },
  esbuild: {
    jsx: 'automatic',
  },
  server: {
    port: 5173, // 指定启动端口
    strictPort: false, // 设为 false：当端口被占用时，自动尝试下一个可用端口（如 5174、5175...）
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
