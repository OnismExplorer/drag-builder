/**
 * E2E 测试：组件拖拽流程
 * 测试从物料库拖拽组件到画布的完整流程
 *
 * 覆盖需求：3.1, 3.2, 3.3, 4.1, 4.6
 */

describe('组件拖拽流程', () => {
  beforeEach(() => {
    // 拦截项目列表请求
    cy.intercept('GET', '/api/projects*', {
      statusCode: 200,
      body: { data: [], total: 0, page: 1, limit: 50 },
    }).as('获取项目列表');

    // 先访问首页，通过 UI 创建画布，再进入编辑器
    cy.visit('/');

    // 点击"创建新项目"，选择桌面规格
    cy.contains('button', '创建新项目').first().click();
    cy.contains('选择画布规格').should('be.visible');
    cy.contains('桌面').click();
    cy.contains('button', '创建画布').click();

    // 等待编辑器加载完成
    cy.url().should('include', '/editor');
    cy.contains('组件库').should('be.visible');
  });

  /**
   * 测试：物料库面板存在且包含所有组件
   */
  it('物料库面板应存在并包含所有组件类型', () => {
    // 验证物料库面板标题
    cy.contains('组件库').should('be.visible');

    // 验证包含基础组件分类
    cy.contains('基础组件').should('be.visible');

    // 验证包含各类组件（通过组件名称）
    cy.contains('Div').should('be.visible');
    cy.contains('Button').should('be.visible');
    cy.contains('Text').should('be.visible');
    cy.contains('Image').should('be.visible');
    cy.contains('Input').should('be.visible');
  });

  /**
   * 测试：画布空状态提示
   */
  it('空画布应显示引导提示文字', () => {
    // 验证画布空状态提示
    cy.contains('从左侧拖拽组件开始设计').should('be.visible');
  });

  /**
   * 测试：属性面板空状态
   */
  it('未选中组件时属性面板应显示空状态提示', () => {
    // 验证属性面板空状态提示
    cy.contains('请选择一个组件').should('be.visible');
  });

  /**
   * 测试：模拟拖拽 Button 组件到画布
   * 使用 dnd-kit 的数据传输机制模拟拖拽
   */
  it('应能将 Button 组件拖拽到画布', () => {
    // 获取 Button 物料项
    const 按钮物料 = cy.contains('Button').closest('div[draggable], div[data-draggable]').first();

    // 获取画布区域
    const 画布区域 = cy.get('.canvas-content');

    // 使用 trigger 模拟 pointer 事件（dnd-kit 使用 PointerSensor）
    按钮物料.trigger('pointerdown', {
      button: 0,
      clientX: 140,
      clientY: 300,
      pointerId: 1,
    });

    // 模拟移动到画布中心
    cy.get('body').trigger('pointermove', {
      clientX: 700,
      clientY: 450,
      pointerId: 1,
    });

    // 在画布上释放
    画布区域.trigger('pointerup', {
      clientX: 700,
      clientY: 450,
      pointerId: 1,
    });

    // 等待组件出现在画布上（画布空状态提示消失）
    cy.contains('从左侧拖拽组件开始设计').should('not.exist');
  });

  /**
   * 测试：点击画布空白区域取消选中
   */
  it('点击画布空白区域应取消组件选中状态', () => {
    // 点击画布空白区域
    cy.get('.canvas-content').click({ force: true });

    // 验证属性面板显示空状态（没有组件被选中）
    cy.contains('请选择一个组件').should('be.visible');
  });

  /**
   * 测试：工具栏存在且包含关键按钮
   */
  it('工具栏应包含"保存项目"和"查看代码"按钮', () => {
    // 验证工具栏按钮
    cy.contains('button', '保存项目').should('be.visible');
    cy.contains('button', '查看代码').should('be.visible');
  });
});
