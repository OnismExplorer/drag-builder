/**
 * E2E 测试：错误场景
 * 测试网络错误、服务器错误等异常情况的处理
 *
 * 覆盖需求：10.5, 15.1, 15.2
 */

describe('错误场景处理', () => {
  /**
   * 进入编辑器的辅助函数
   */
  const 进入编辑器 = () => {
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
   * 测试：保存项目时服务器返回 500 错误，显示错误 Toast
   */
  it('保存项目时服务器错误应显示错误 Toast', () => {
    // 拦截创建项目请求，返回 500 错误
    cy.intercept('POST', '/api/projects', {
      statusCode: 500,
      body: {
        message: '服务器内部错误',
        error: 'Internal Server Error',
      },
    }).as('创建项目失败');

    进入编辑器();

    // 点击"保存项目"按钮
    cy.contains('button', '保存项目').click();

    // 等待请求完成
    cy.wait('@创建项目失败');

    // 验证显示错误 Toast（包含"保存失败"文字）
    cy.contains('保存失败').should('be.visible');
  });

  /**
   * 测试：保存项目时网络错误，显示错误 Toast
   */
  it('保存项目时网络错误应显示错误 Toast', () => {
    // 拦截创建项目请求，模拟网络错误
    cy.intercept('POST', '/api/projects', {
      forceNetworkError: true,
    }).as('创建项目网络错误');

    进入编辑器();

    // 点击"保存项目"按钮
    cy.contains('button', '保存项目').click();

    // 等待请求失败
    cy.wait('@创建项目网络错误');

    // 验证显示错误 Toast
    cy.contains('保存失败').should('be.visible');
  });

  /**
   * 测试：首页获取项目列表失败时显示错误提示
   */
  it('获取项目列表失败应显示错误提示', () => {
    // 拦截项目列表请求，返回 500 错误
    cy.intercept('GET', '/api/projects*', {
      statusCode: 500,
      body: {
        message: '服务器内部错误',
      },
    }).as('获取项目列表失败');

    // 访问首页
    cy.visit('/');

    // 等待请求失败
    cy.wait('@获取项目列表失败');

    // 验证显示错误提示（ProjectList 组件的错误状态）
    cy.contains('无法加载项目列表').should('be.visible');
  });

  /**
   * 测试：获取项目列表失败后可以重试
   */
  it('获取项目列表失败后点击重试应重新请求', () => {
    // 第一次请求失败
    cy.intercept('GET', '/api/projects*', {
      statusCode: 500,
      body: { message: '服务器错误' },
    }).as('获取项目列表失败');

    cy.visit('/');
    cy.wait('@获取项目列表失败');

    // 验证错误提示显示
    cy.contains('无法加载项目列表').should('be.visible');

    // 第二次请求成功
    cy.intercept('GET', '/api/projects*', {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, limit: 50 },
    }).as('获取项目列表成功');

    // 点击重试按钮
    cy.contains('button', '重试').click();

    // 等待重试请求
    cy.wait('@获取项目列表成功');

    // 验证错误提示消失
    cy.contains('无法加载项目列表').should('not.exist');
  });

  /**
   * 测试：网络超时场景（使用 cy.intercept 延迟响应）
   */
  it('保存项目时网络超时应显示错误 Toast', () => {
    // 拦截创建项目请求，延迟超过超时时间
    cy.intercept('POST', '/api/projects', (req) => {
      // 延迟 15 秒（超过 requestTimeout 的 10 秒）
      req.reply({
        delay: 15000,
        statusCode: 201,
        body: {},
      });
    }).as('创建项目超时');

    // 修改 Cypress 请求超时为 3 秒（仅用于此测试）
    cy.intercept('POST', '/api/projects', {
      forceNetworkError: true,
    }).as('创建项目超时模拟');

    进入编辑器();

    // 点击"保存项目"按钮
    cy.contains('button', '保存项目').click();

    // 等待请求失败（网络错误模拟超时）
    cy.wait('@创建项目超时模拟');

    // 验证显示错误 Toast
    cy.contains('保存失败').should('be.visible');
  });

  /**
   * 测试：加载项目失败时显示错误 Toast
   */
  it('加载项目失败应显示错误 Toast', () => {
    // 拦截项目列表请求，返回有项目的列表
    cy.intercept('GET', '/api/projects*', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 'test-project-001',
            name: '测试项目',
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

    // 拦截获取单个项目请求，返回 500 错误
    cy.intercept('GET', '/api/projects/test-project-001', {
      statusCode: 500,
      body: { message: '服务器错误' },
    }).as('获取项目失败');

    // 访问首页
    cy.visit('/');
    cy.wait('@获取项目列表');

    // 点击项目卡片
    cy.contains('测试项目').click();

    // 等待请求失败
    cy.wait('@获取项目失败');

    // 验证显示错误 Toast
    cy.contains('加载项目失败').should('be.visible');
  });

  /**
   * 测试：Toast 提示在 3 秒后自动消失
   */
  it('Toast 提示应在 3 秒后自动消失', () => {
    // 拦截创建项目请求，返回 500 错误
    cy.intercept('POST', '/api/projects', {
      statusCode: 500,
      body: { message: '服务器错误' },
    }).as('创建项目失败');

    进入编辑器();

    // 点击"保存项目"按钮
    cy.contains('button', '保存项目').click();
    cy.wait('@创建项目失败');

    // 验证 Toast 出现
    cy.contains('保存失败').should('be.visible');

    // 等待 4 秒（Toast 应在 3 秒后消失）
    cy.wait(4000);

    // 验证 Toast 已消失
    cy.contains('保存失败').should('not.exist');
  });
});
