describe('认证系统', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('未登录访问', () => {
    it('应显示 Landing Page', () => {
      cy.contains('快速构建你的').should('be.visible');
      cy.contains('立即体验').should('be.visible');
    });

    it('点击立即体验应跳转到注册页', () => {
      cy.contains('立即体验').click();
      cy.url().should('include', '/register');
    });

    it('点击登录应跳转到登录页', () => {
      cy.contains('登录').first().click();
      cy.url().should('include', '/login');
    });
  });

  describe('GitHub 登录', () => {
    it('登录页应显示 GitHub 登录按钮', () => {
      cy.visit('/login');
      cy.contains('使用 GitHub 登录').should('be.visible');
    });

    it('点击 GitHub 登录按钮应跳转到 GitHub 授权页', () => {
      cy.visit('/login');
      cy.contains('使用 GitHub 登录').click();
      cy.url().should('include', 'github.com');
    });
  });

  describe('登录页', () => {
    it('应显示用户名/邮箱输入框', () => {
      cy.visit('/login');
      cy.get('input[placeholder="输入用户名或邮箱"]').should('be.visible');
    });

    it('应显示密码输入框', () => {
      cy.visit('/login');
      cy.get('input[placeholder="输入密码"]').should('be.visible');
    });

    it('应显示登录按钮', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').should('contain', '登录');
    });
  });

  describe('注册页', () => {
    it('应显示邮箱输入框', () => {
      cy.visit('/register');
      cy.get('input[type="email"]').should('be.visible');
    });

    it('应显示获取验证码按钮', () => {
      cy.visit('/register');
      cy.contains('获取验证码').should('be.visible');
    });

    it('应显示密码输入框', () => {
      cy.visit('/register');
      cy.get('input[placeholder="至少 8 个字符"]').should('be.visible');
    });
  });

  describe('GitHub 回调页', () => {
    it('无 code 参数应显示错误', () => {
      cy.visit('/auth/github/callback');
      cy.contains('未收到授权码').should('be.visible');
    });
  });
});