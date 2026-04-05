-- ============================================
-- DragBuilder 数据库初始化脚本
-- ============================================
-- 功能：创建 projects 表和相关索引
-- 数据库：PostgreSQL 16+
-- 用户：onism
-- 密码：123456
-- 端口：5432
-- ============================================

-- 创建数据库（如果不存在）
-- 注意：此命令需要在 postgres 数据库中执行
-- CREATE DATABASE dragbuilder OWNER onism;

-- 连接到 dragbuilder 数据库后执行以下脚本
-- \c dragbuilder

-- ============================================
-- 删除已存在的表（开发环境使用，生产环境请谨慎）
-- ============================================
DROP TABLE IF EXISTS projects CASCADE;

-- ============================================
-- 创建 projects 表
-- ============================================
CREATE TABLE projects (
    -- 主键：使用 UUID 作为唯一标识符
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 项目名称：最大 255 字符，不允许为空
    name VARCHAR(255) NOT NULL,
    
    -- 画布配置：使用 JSONB 类型存储画布配置（宽高、缩放、平移等）
    -- JSONB 支持高效的查询和索引
    canvas_config JSONB NOT NULL,
    
    -- 组件树：使用 JSONB 类型存储完整的组件树 DSL
    -- 包含所有组件节点的位置、样式、内容等信息
    components_tree JSONB NOT NULL,
    
    -- 创建时间：自动设置为当前时间
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- 更新时间：自动设置为当前时间
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================
-- 创建索引以优化查询性能
-- ============================================

-- 为 name 字段创建索引，优化按名称搜索的性能
CREATE INDEX idx_projects_name ON projects(name);

-- 为 created_at 字段创建索引，优化按创建时间排序和筛选的性能
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- 为 updated_at 字段创建索引，优化按更新时间排序和筛选的性能
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);

-- 为 JSONB 字段创建 GIN 索引，优化 JSONB 查询性能
-- 这允许高效查询画布配置和组件树中的特定字段
CREATE INDEX idx_projects_canvas_config ON projects USING GIN(canvas_config);
CREATE INDEX idx_projects_components_tree ON projects USING GIN(components_tree);

-- ============================================
-- 创建触发器函数：自动更新 updated_at 字段
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：在 UPDATE 操作时自动更新 updated_at
CREATE TRIGGER trigger_update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 添加表注释
-- ============================================
COMMENT ON TABLE projects IS 'DragBuilder 项目表，存储可视化编程工具的项目数据';
COMMENT ON COLUMN projects.id IS '项目唯一标识符（UUID）';
COMMENT ON COLUMN projects.name IS '项目名称';
COMMENT ON COLUMN projects.canvas_config IS '画布配置（JSONB），包含宽高、缩放、平移等信息';
COMMENT ON COLUMN projects.components_tree IS '组件树（JSONB），包含所有组件节点的完整 DSL';
COMMENT ON COLUMN projects.created_at IS '项目创建时间';
COMMENT ON COLUMN projects.updated_at IS '项目最后更新时间';

-- ============================================
-- 完成
-- ============================================
-- 初始化脚本执行完成
-- 可以使用 \dt 查看表结构
-- 可以使用 \d projects 查看表详情
