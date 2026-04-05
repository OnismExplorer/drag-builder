/**
 * E2E 测试：画布创建流程
 * 测试用户从首页创建画布的完整流程
 *
 * 覆盖需求：1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

describe('画布创建流程', () => {
  beforeEach(() => {
    // 拦截项目列表请求，返回空列表（避免依赖后端）
    cy.intercept('GET', '/api/projects*', {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, limit: 50 },
    }).as('获取项目列表');

    // 访问首页
    cy.visit('/');
  });

  /**
   * 测试：首页包含"创建新项目"按钮
   */
  it('首页应显示"创建新项目"按钮', () => {
    // 验证页面标题存在
    cy.contains('DragBuilder').should('be.visible');

    // 验证"创建新项目"按钮存在（导航栏中的按钮）
    cy.contains('button', '创建新项目').should('be.visible');

    // 验证"立即开始"按钮也存在（Hero 区域）
    cy.contains('button', '立即开始').should('be.visible');
  });

  /**
   * 测试：点击"创建新项目"按钮弹出画布规格模态框
   */
  it('点击"创建新项目"应弹出画布规格选择模态框', () => {
    // 点击导航栏中的"创建新项目"按钮
    cy.contains('button', '创建新项目').first().click();

    // 验证模态框出现
    cy.contains('选择画布规格').should('be.visible');

    // 验证四个预设选项都存在
    cy.contains('手机').should('be.visible');
    cy.contains('平板').should('be.visible');
    cy.contains('桌面').should('be.visible');
    cy.contains('自定义').should('be.visible');
  });

  /**
   * 测试：选择手机规格（375x667）并跳转到编辑器
   */
  it('选择手机规格应跳转到编辑器页面', () => {
    // 打开模态框
    cy.contains('button', '创建新项目').first().click();
    cy.contains('选择画布规格').should('be.visible');

    // 选择手机规格
    cy.contains('手机').click();

    // 验证手机规格描述显示
    cy.contains('375 × 667 px').should('be.visible');

    // 点击"创建画布"按钮
    cy.contains('button', '创建画布').click();

    // 验证跳转到编辑器页面
    cy.url().should('include', '/editor');

    // 验证编辑器页面加载完成（物料库面板存在）
    cy.contains('组件库').should('be.visible');
  });

  /**
   * 测试：选择平板规格（768x1024）并跳转到编辑器
   */
  it('选择平板规格应跳转到编辑器页面', () => {
    cy.contains('button', '创建新项目').first().click();
    cy.contains('选择画布规格').should('be.visible');

    // 选择平板规格
    cy.contains('平板').click();
    cy.contains('768 × 1024 px').should('be.visible');

    cy.contains('button', '创建画布').click();
    cy.url().should('include', '/editor');
    cy.contains('组件库').should('be.visible');
  });

  /**
   * 测试：选择桌面规格（1440x900）并跳转到编辑器
   */
  it('选择桌面规格应跳转到编辑器页面', () => {
    cy.contains('button', '创建新项目').first().click();
    cy.contains('选择画布规格').should('be.visible');

    // 选择桌面规格（默认已选中）
    cy.contains('桌面').click();
    cy.contains('1440 × 900 px').should('be.visible');

    cy.contains('button', '创建画布').click();
    cy.url().should('include', '/editor');
    cy.contains('组件库').should('be.visible');
  });

  /**
   * 测试：选择自定义规格，输入宽高，跳转到编辑器
   */
  it('选择自定义规格并输入有效尺寸应跳转到编辑器', () => {
    cy.contains('button', '创建新项目').first().click();
    cy.contains('选择画布规格').should('be.visible');

    // 选择自定义规格
    cy.contains('自定义').click();

    // 验证自定义输入框出现
    cy.get('#canvas-width').should('be.visible');
    cy.get('#canvas-height').should('be.visible');

    // 输入自定义尺寸
    cy.get('#canvas-width').clear().type('1200');
    cy.get('#canvas-height').clear().type('800');

    // 点击创建
    cy.contains('button', '创建画布').click();

    // 验证跳转到编辑器
    cy.url().should('include', '/editor');
    cy.contains('组件库').should('be.visible');
  });

  /**
   * 测试：自定义规格输入小于 100px 时显示验证错误
   */
  it('自定义规格输入小于 100px 应显示验证错误', () => {
    cy.contains('button', '创建新项目').first().click();
    cy.contains('选择画布规格').should('be.visible');

    // 选择自定义规格
    cy.contains('自定义').click();

    // 输入无效的宽度（小于 100px）
    cy.get('#canvas-width').clear().type('50');
    cy.get('#canvas-height').clear().type('50');

    // 点击创建按钮
    cy.contains('button', '创建画布').click();

    // 验证显示错误提示
    cy.contains('尺寸必须在').should('be.visible');

    // 验证没有跳转到编辑器
    cy.url().should('not.include', '/editor');
  });

  /**
   * 测试：点击取消按钮关闭模态框
   */
  it('点击取消按钮应关闭模态框', () => {
    cy.contains('button', '创建新项目').first().click();
    cy.contains('选择画布规格').should('be.visible');

    // 点击取消按钮
    cy.contains('button', '取消').click();

    // 验证模态框关闭
    cy.contains('选择画布规格').should('not.exist');

    // 验证仍在首页
    cy.url().should('not.include', '/editor');
  });
});
