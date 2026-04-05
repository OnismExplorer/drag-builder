/**
 * Cypress E2E 支持文件
 * 在每个测试文件执行前自动加载
 */

// 导入自定义命令
import './commands';

// 忽略未捕获的异常，防止第三方库的错误导致测试失败
Cypress.on('uncaught:exception', (err) => {
  // 忽略 ResizeObserver 相关错误（常见于动画库）
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
  // 忽略 framer-motion 相关错误
  if (err.message.includes('framer-motion')) {
    return false;
  }
  // 其他错误正常抛出
  return true;
});
