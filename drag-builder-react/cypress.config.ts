import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // 前端开发服务器地址
    baseUrl: 'http://localhost:5173',
    // 测试文件匹配规则
    specPattern: 'cypress/e2e/**/*.cy.ts',
    // 支持文件路径
    supportFile: 'cypress/support/e2e.ts',
    // 视口尺寸（桌面端）
    viewportWidth: 1440,
    viewportHeight: 900,
    // 不录制视频（节省空间）
    video: false,
    // 失败时截图
    screenshotOnRunFailure: true,
    // 默认命令超时时间（毫秒）
    defaultCommandTimeout: 10000,
    // 请求超时时间（毫秒）
    requestTimeout: 10000,
  },
});
