/**
 * Cypress 自定义命令
 * 封装常用操作，提高测试代码复用性
 */

/// <reference types="cypress" />

/**
 * 自定义命令类型声明
 */
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * 创建画布：点击"创建新项目"按钮并选择规格
       * @param preset 画布规格：'mobile' | 'tablet' | 'desktop' | 'custom'
       */
      createCanvas(preset?: '手机' | '平板' | '桌面' | '自定义'): Chainable<void>;

      /**
       * 模拟从物料库拖拽组件到画布
       * @param componentName 组件名称（如 'Button'、'Text'）
       */
      dragToCanvas(componentName: string): Chainable<void>;

      /**
       * 等待 Toast 提示出现并验证内容
       * @param message Toast 消息内容
       */
      waitForToast(message: string): Chainable<void>;

      /**
       * 通过 Zustand store 初始化画布状态（用于跳过 UI 操作）
       */
      initCanvasState(): Chainable<void>;
    }
  }
}

/**
 * 创建画布命令
 * 点击"创建新项目"按钮，选择规格，跳转到编辑器
 */
Cypress.Commands.add('createCanvas', (preset = '桌面') => {
  // 点击"创建新项目"按钮（使用项目列表区域的按钮）
  cy.contains('button', '创建新项目').first().click();

  // 等待模态框出现
  cy.contains('选择画布规格').should('be.visible');

  // 选择对应规格
  cy.contains(preset).click();

  // 点击"创建画布"按钮
  cy.contains('button', '创建画布').click();

  // 等待跳转到编辑器页面
  cy.url().should('include', '/editor');
});

/**
 * 拖拽组件到画布命令
 * 使用 trigger 模拟鼠标事件（Cypress 拖拽 API 限制）
 */
Cypress.Commands.add('dragToCanvas', (componentName: string) => {
  // 获取物料库中的组件元素
  const 物料元素 = cy.contains(componentName).closest('[draggable]');

  // 获取画布区域
  const 画布元素 = cy.get('.canvas-content');

  // 模拟拖拽：触发 dragstart -> dragover -> drop 事件序列
  物料元素.trigger('mousedown', { button: 0 });
  物料元素.trigger('mousemove', { clientX: 100, clientY: 100 });

  画布元素.trigger('mousemove', { clientX: 700, clientY: 400 });
  画布元素.trigger('mouseup', { clientX: 700, clientY: 400 });
});

/**
 * 等待 Toast 提示命令
 */
Cypress.Commands.add('waitForToast', (message: string) => {
  cy.contains(message, { timeout: 8000 }).should('be.visible');
});

/**
 * 初始化画布状态命令
 * 通过 window 对象直接操作 Zustand store，跳过 UI 操作
 */
Cypress.Commands.add('initCanvasState', () => {
  cy.window().then((win) => {
    // 通过全局 store 设置画布配置
    // 注意：需要应用将 store 暴露到 window 对象
    const 画布配置 = {
      width: 1440,
      height: 900,
      preset: 'desktop' as const,
      backgroundColor: '#FFFFFF',
    };

    // 触发自定义事件，让应用初始化画布状态
    win.dispatchEvent(
      new CustomEvent('cypress:init-canvas', { detail: 画布配置 })
    );
  });
});

// 导出空对象以使 TypeScript 将此文件视为模块
export {};
