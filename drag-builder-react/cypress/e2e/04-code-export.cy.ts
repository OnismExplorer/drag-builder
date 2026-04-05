/**
 * E2E 测试：代码导出流程
 * 测试查看代码和复制代码的完整流程
 *
 * 覆盖需求：9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.8
 */

describe('代码导出流程', () => {
  beforeEach(() => {
    // 拦截项目列表请求
    cy.intercept('GET', '/api/projects*', {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, limit: 50 },
    }).as('获取项目列表');

    // 进入编辑器
    cy.visit('/');
    cy.contains('button', '创建新项目').first().click();
    cy.contains('选择画布规格').should('be.visible');
    cy.contains('桌面').click();
    cy.contains('button', '创建画布').click();
    cy.url().should('include', '/editor');
    cy.contains('组件库').should('be.visible');
  });

  /**
   * 测试：点击"查看代码"按钮打开代码预览模态框
   */
  it('点击"查看代码"应打开代码预览模态框', () => {
    // 点击"查看代码"按钮
    cy.contains('button', '查看代码').click();

    // 验证代码预览模态框出现
    cy.contains('生成的代码').should('be.visible');
  });

  /**
   * 测试：代码预览包含 React 导入语句
   */
  it('代码预览应包含 import React 语句', () => {
    // 打开代码预览
    cy.contains('button', '查看代码').click();
    cy.contains('生成的代码').should('be.visible');

    // 验证代码包含 import React
    cy.contains('import React').should('be.visible');
  });

  /**
   * 测试：代码预览包含默认导出语句
   */
  it('代码预览应包含 export default 语句', () => {
    // 打开代码预览
    cy.contains('button', '查看代码').click();
    cy.contains('生成的代码').should('be.visible');

    // 验证代码包含 export default
    cy.contains('export default').should('be.visible');
  });

  /**
   * 测试：空画布时显示空组件模板提示
   */
  it('空画布时代码预览应显示空组件模板提示', () => {
    // 打开代码预览
    cy.contains('button', '查看代码').click();
    cy.contains('生成的代码').should('be.visible');

    // 验证空画布提示
    cy.contains('画布为空，显示空组件模板').should('be.visible');
  });

  /**
   * 测试：代码预览包含"复制代码"按钮
   */
  it('代码预览应包含"复制代码"按钮', () => {
    // 打开代码预览
    cy.contains('button', '查看代码').click();
    cy.contains('生成的代码').should('be.visible');

    // 验证"复制代码"按钮存在
    cy.contains('button', '复制代码').should('be.visible');
  });

  /**
   * 测试：点击"复制代码"按钮显示复制成功提示
   */
  it('点击"复制代码"应显示复制成功 Toast', () => {
    // 模拟 clipboard API（Cypress 测试环境中 clipboard 可能不可用）
    cy.window().then((win) => {
      // 创建模拟的 clipboard API
      const 模拟剪贴板 = {
        writeText: cy.stub().resolves(),
      };
      Object.defineProperty(win.navigator, 'clipboard', {
        value: 模拟剪贴板,
        writable: true,
      });
    });

    // 打开代码预览
    cy.contains('button', '查看代码').click();
    cy.contains('生成的代码').should('be.visible');

    // 点击"复制代码"按钮
    cy.contains('button', '复制代码').click();

    // 验证显示复制成功 Toast
    cy.contains('代码已复制到剪贴板').should('be.visible');
  });

  /**
   * 测试：关闭代码预览模态框
   */
  it('应能关闭代码预览模态框', () => {
    // 打开代码预览
    cy.contains('button', '查看代码').click();
    cy.contains('生成的代码').should('be.visible');

    // 点击关闭按钮（模态框右上角的 X 按钮）
    cy.get('[aria-label="关闭"]').first().click();

    // 验证模态框关闭
    cy.contains('生成的代码').should('not.exist');
  });
});
