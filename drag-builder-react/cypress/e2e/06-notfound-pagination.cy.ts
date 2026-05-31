/**
 * E2E 测试：404 兜底页与分页功能
 *
 * 覆盖需求：
 * - 404 兜底页：访问不存在的路径显示 NotFoundPage
 * - 分页功能：项目列表正确请求分页参数，显示分页控件
 */

describe('404 兜底页与分页功能', () => {
  describe('404 兜底页', () => {
    /**
     * 测试：访问不存在的路径应显示 404 页面
     */
    it('访问不存在的路径应显示 NotFoundPage', () => {
      cy.visit('/this-route-does-not-exist');

      // 验证显示 404 文字
      cy.contains('404').should('be.visible');

      // 验证显示错误提示
      cy.contains('页面不存在').should('be.visible');

      // 验证显示返回首页按钮
      cy.contains('返回首页').should('be.visible');
    });

    /**
     * 测试：404 页面的"返回首页"按钮应跳转到首页
     */
    it('404 页面的"返回首页"按钮应正常工作', () => {
      cy.visit('/this-route-does-not-exist');

      cy.contains('返回首页').click();

      // 应跳转到首页（登录后）
      cy.url().should('not.include', '/this-route-does-not-exist');
    });

    /**
     * 测试：404 页面 Logo 应正常显示
     */
    it('404 页面应显示 DragBuilder Logo', () => {
      cy.visit('/xyz-not-found');
      cy.contains('DragBuilder').should('be.visible');
    });
  });

  describe('项目列表分页', () => {
    /**
     * 测试：分页参数应正确发送（page=1, limit=12）
     */
    it('分页参数应正确发送（page=1, limit=12）', () => {
      cy.intercept('GET', '/api/projects*', {
        statusCode: 200,
        body: {
          data: [],
          total: 0,
          page: 1,
          limit: 12,
        },
      }).as('获取项目列表');

      cy.login();
      cy.visit('/');
      cy.resetUIState();
      cy.wait('@获取项目列表', { timeout: 10000 });
    });

    /**
     * 测试：项目总数应正确显示
     */
    it('应正确显示项目总数', () => {
      const mockProjects = Array.from({ length: 15 }, (_, i) => ({
        id: `proj-${i + 1}`,
        name: `项目 ${i + 1}`,
        canvasConfig: { width: 1440, height: 900, preset: 'desktop', backgroundColor: '#FFFFFF' },
        componentsTree: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      cy.intercept('GET', '/api/projects*', {
        statusCode: 200,
        body: { data: mockProjects.slice(0, 12), total: 15, page: 1, limit: 12 },
      }).as('获取项目列表第一页');

      cy.login();
      cy.visit('/');
      cy.resetUIState();

      cy.wait('@获取项目列表第一页', { timeout: 10000 });

      cy.contains('共 15 个项目').should('be.visible');
    });

    /**
     * 测试：有多页时应显示分页控件
     */
    it('超过一页时应显示分页控件', () => {
      const mockProjects = Array.from({ length: 25 }, (_, i) => ({
        id: `proj-${i + 1}`,
        name: `项目 ${i + 1}`,
        canvasConfig: { width: 1440, height: 900, preset: 'desktop', backgroundColor: '#FFFFFF' },
        componentsTree: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      cy.intercept('GET', '/api/projects*', {
        statusCode: 200,
        body: { data: mockProjects.slice(0, 12), total: 25, page: 1, limit: 12 },
      }).as('获取项目列表');

      cy.login();
      cy.visit('/');
      cy.resetUIState();
      cy.wait('@获取项目列表', { timeout: 10000 });

      cy.contains('第 1 / 3 页').should('be.visible');
      cy.contains('button', '上一页').should('be.visible');
      cy.contains('button', '下一页').should('be.visible');
    });

    /**
     * 测试：点击"下一页"应加载第二页
     */
    it('点击"下一页"应请求第二页数据', () => {
      cy.intercept('GET', '/api/projects*', {
        statusCode: 200,
        body: {
          data: Array.from({ length: 12 }, (_, i) => ({
            id: `proj-page1-${i + 1}`,
            name: `第1页项目 ${i + 1}`,
            canvasConfig: { width: 1440, height: 900, preset: 'desktop', backgroundColor: '#FFFFFF' },
            componentsTree: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          total: 36,
          page: 1,
          limit: 12,
        },
      }).as('获取项目列表第一页');

      cy.login();
      cy.visit('/');
      cy.resetUIState();
      cy.wait('@获取项目列表第一页', { timeout: 10000 });

      cy.contains('第 1 / 3 页').should('be.visible');

      cy.contains('button', '下一页').click();

      cy.contains('第 2 / 3 页').should('be.visible');
    });

    /**
     * 测试：首页时"上一页"按钮应禁用
     */
    it('首页时"上一页"按钮应禁用', () => {
      cy.intercept('GET', '/api/projects*', {
        statusCode: 200,
        body: {
          data: Array.from({ length: 12 }, (_, i) => ({
            id: `proj-${i + 1}`,
            name: `项目 ${i + 1}`,
            canvasConfig: { width: 1440, height: 900, preset: 'desktop', backgroundColor: '#FFFFFF' },
            componentsTree: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
          total: 15,
          page: 1,
          limit: 12,
        },
      }).as('获取项目列表');

      cy.login();
      cy.visit('/');
      cy.resetUIState();
      cy.wait('@获取项目列表', { timeout: 10000 });

      cy.contains('button', '上一页').should('be.disabled');
    });

    /**
     * 测试：末页时"下一页"按钮应禁用
     */
    it('末页时"下一页"按钮应禁用', () => {
      cy.intercept('GET', '/api/projects*', (req) => {
        const page = new URL(req.url).searchParams.get('page') || '1';
        if (page === '1') {
          req.reply({
            statusCode: 200,
            body: {
              data: Array.from({ length: 12 }, (_, i) => ({
                id: `proj-${i + 1}`,
                name: `项目 ${i + 1}`,
                canvasConfig: { width: 1440, height: 900, preset: 'desktop', backgroundColor: '#FFFFFF' },
                componentsTree: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })),
              total: 15,
              page: 1,
              limit: 12,
            },
          });
        } else if (page === '2') {
          req.reply({
            statusCode: 200,
            body: {
              data: Array.from({ length: 3 }, (_, i) => ({
                id: `proj-page2-${i + 1}`,
                name: `第2页项目 ${i + 1}`,
                canvasConfig: { width: 1440, height: 900, preset: 'desktop', backgroundColor: '#FFFFFF' },
                componentsTree: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })),
              total: 15,
              page: 2,
              limit: 12,
            },
          });
        }
      }).as('获取项目列表');

      cy.login();
      cy.visit('/');
      cy.resetUIState();
      cy.wait('@获取项目列表', { timeout: 10000 });

      cy.contains('button', '下一页').should('not.be.disabled');

      cy.contains('button', '下一页').click();
      cy.wait('@获取项目列表', { timeout: 10000 });

      cy.contains('button', '下一页').should('be.disabled');
    });

    /**
     * 测试：空项目列表不应显示分页控件
     */
    it('空项目列表不应显示分页控件', () => {
      cy.intercept('GET', '/api/projects*', {
        statusCode: 200,
        body: { data: [], total: 0, page: 1, limit: 12 },
      }).as('获取项目列表');

      cy.login();
      cy.visit('/');
      cy.resetUIState();
      cy.wait('@获取项目列表', { timeout: 10000 });

      cy.contains('暂无项目').should('be.visible');
      cy.contains('上一页').should('not.exist');
      cy.contains('下一页').should('not.exist');
    });
  });
});
