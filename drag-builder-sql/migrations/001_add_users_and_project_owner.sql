-- ============================================
-- DragBuilder 用户认证迁移脚本
-- 创建 users 表和 projects 表关联
-- ============================================

-- ============================================
-- 创建 users 表
-- ============================================
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255),
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- 创建 partial unique index（nullable 唯一约束）
-- PostgreSQL 中 NULL 不参与唯一约束，需要 WHERE 过滤
-- ============================================
CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;

-- 创建触发器：自动更新 updated_at
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 为 projects 表添加 user_id 外键
-- ============================================
ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- ============================================
-- 添加表注释
-- ============================================
COMMENT ON TABLE users IS 'DragBuilder 用户表，存储用户认证信息';
COMMENT ON COLUMN users.id IS '用户唯一标识符（UUID）';
COMMENT ON COLUMN users.username IS '用户名（可选，唯一）';
COMMENT ON COLUMN users.email IS '邮箱（可选，唯一）';
COMMENT ON COLUMN users.password_hash IS 'bcrypt 密码哈希';
COMMENT ON COLUMN users.display_name IS '显示名称';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';
