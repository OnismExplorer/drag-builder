/**
 * E2E 测试：保存和加载流程
 * 测试项目保存到后端和从后端加载的完整流程
 *
 * 覆盖需求：10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8
 */

describe('保存和加载流程', () => {
  /**
   * 进入编辑器的辅助函数
   */
  const 进入编辑器 = () => {
    // 拦截项目列表请求
    cy.intercept('GET', '/api/projects*', {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, limit: 50 },
    }).as('获取项目列表');

    cy.visit('/');
    cy.contains('button', '创建新项目').first().click();
    cy.contains('选择画布规格').should('be.visible');
    cy.contains('桌面').click();
    cy.contains('button', '创建画布').click();
    cy.url().should('include', '/editor');
  };

  /**
   * 测试：点击"保存项目"按钮成功保存并显示 Toast
   */
  it('点击"保存项目"成功时应显示"保存成功" Toast', () => {
    // 拦截创建项目请求，返回成功响应
    cy.intercept('POST', '/api/projects', {
      statusCode: 201,
      body: {
        id: 'new-project-001',
        name: '未命名项目',
        canvasConfig: {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        },
        componentsTree: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    }).as('创建项目');

    进入编辑器();

    // 点击"保存项目"按钮
    cy.contains('button', '保存项目').click();

    // 等待 API 请求完成
    cy.wait('@创建项目');

    // 验证显示"保存成功" Toast
    cy.contains('保存成功').should('be.visible');
  });

  /**
   * 测试：首页项目列表显示已保存的项目
   */
  it('首页应显示项目列表', () => {
    // 拦截项目列表请求，返回模拟数据
    cy.intercept('GET', '/api/projects*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'test-project-001',
            name: '测试项目一',
            canvasConfig: {
              width: 1440,
              height: 900,
              preset: 'desktop',
              backgroundColor: '#FFFFFF',
            },
            componentsTree: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            id: 'test-project-002',
            name: '测试项目二',
            canvasConfig: {
              width: 375,
              height: 667,
              preset: 'mobile',
              backgroundColor: '#FFFFFF',
            },
            componentsTree: [],
            createdAt: '2024-01-02T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
          },
        ],
        total: 2,
        page: 1,
        limit: 50,
      },
    }).as('获取项目列表');

    // 访问首页
    cy.visit('/');

    // 等待项目列表加载
    cy.wait('@获取项目列表');

    // 验证项目列表显示
    cy.contains('测试项目一').should('be.visible');
    cy.contains('测试项目二').should('be.visible');

    // 验证项目数量显示
    cy.contains('共 2 个项目').should('be.visible');
  });

  /**
   * 测试：点击项目卡片加载项目并跳转到编辑器
   */
  it('点击项目卡片应加载项目并跳转到编辑器', () => {
    // 拦截项目列表请求
    cy.intercept('GET', '/api/projects*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'test-project-001',
            name: '测试项目一',
            canvasConfig: {
              width: 1440,
              height: 900,
              preset: 'desktop',
              backgroundColor: '#FFFFFF',
            },
            componentsTree: [],
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
      },
    }).as('获取项目列表');

    // 拦截获取单个项目请求
    cy.intercept('GET', '/api/projects/test-project-001', {
      statusCode: 200,
      body: {
        id: 'test-project-001',
        name: '测试项目一',
        canvasConfig: {
          width: 1440,
          height: 900,
          preset: 'desktop',
          backgroundColor: '#FFFFFF',
        },
        componentsTree: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    }).as('获取单个项目');

    // 访问首页
    cy.visit('/');
    cy.wait('@获取项目列表');

    // 点击项目卡片
    cy.contains('测试项目一').click();

    // 等待项目加载
    cy.wait('@获取单个项目');

    // 验证跳转到编辑器
    cy.url().should('include', '/editor');

    // 验证显示加载成功 Toast
    cy.contains('已加载项目').should('be.visible');
  });

  /**
   * 测试：保存按钮在保存过程中显示加载状态
   */
  it('保存过程中按钮应显示加载状态', () => {
    // 拦截创建项目请求，延迟响应以观察加载状态
    cy.intercept('POST', '/api/projects', req => {
      req.reply({
        delay: 1000, // 延迟 1 秒
        statusCode: 201,
        body: {
          id: 'new-project-001',
          name: '未命名项目',
          canvasConfig: {
            width: 1440,
            height: 900,
            preset: 'desktop',
            backgroundColor: '#FFFFFF',
          },
          componentsTree: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      });
    }).as('创建项目延迟');

    进入编辑器();

    // 点击保存按钮
    cy.contains('button', '保存项目').click();

    // 验证按钮显示"保存中..."状态
    cy.contains('保存中...').should('be.visible');

    // 等待保存完成
    cy.wait('@创建项目延迟');

    // 验证保存成功 Toast
    cy.contains('保存成功').should('be.visible');
  });
});
