-- ============================================
-- DragBuilder 数据库连接测试脚本
-- ============================================
-- 功能：验证数据库连接和表结构
-- 使用方法：psql -U onism -d dragbuilder -f test-connection.sql
-- ============================================

-- 显示当前连接信息
\echo '=========================================='
\echo '数据库连接测试'
\echo '=========================================='
\echo ''

-- 显示当前数据库
\echo '当前数据库：'
SELECT current_database();
\echo ''

-- 显示当前用户
\echo '当前用户：'
SELECT current_user;
\echo ''

-- 显示 PostgreSQL 版本
\echo 'PostgreSQL 版本：'
SELECT version();
\echo ''

-- 显示所有表
\echo '=========================================='
\echo '数据库表列表'
\echo '=========================================='
\dt
\echo ''

-- 显示 projects 表结构
\echo '=========================================='
\echo 'projects 表结构'
\echo '=========================================='
\d projects
\echo ''

-- 显示所有索引
\echo '=========================================='
\echo '索引列表'
\echo '=========================================='
\di
\echo ''

-- 显示触发器
\echo '=========================================='
\echo '触发器列表'
\echo '=========================================='
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
\echo ''

-- 统计项目数量
\echo '=========================================='
\echo '数据统计'
\echo '=========================================='
\echo '项目总数：'
SELECT COUNT(*) as total_projects FROM projects;
\echo ''

-- 显示所有项目概览
\echo '项目列表：'
SELECT 
    id,
    name,
    canvas_config->>'width' || 'x' || canvas_config->>'height' as canvas_size,
    canvas_config->>'preset' as preset,
    jsonb_array_length(components_tree) as components,
    created_at
FROM projects
ORDER BY created_at DESC;
\echo ''

-- 测试 JSONB 查询
\echo '=========================================='
\echo 'JSONB 查询测试'
\echo '=========================================='
\echo '桌面端项目：'
SELECT 
    name,
    canvas_config->>'width' as width,
    canvas_config->>'height' as height
FROM projects
WHERE canvas_config->>'preset' = 'desktop';
\echo ''

-- 测试索引使用情况
\echo '=========================================='
\echo '索引使用情况'
\echo '=========================================='
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
\echo ''

-- 测试触发器功能
\echo '=========================================='
\echo '触发器功能测试'
\echo '=========================================='
\echo '更新一个项目以测试 updated_at 触发器...'

-- 保存当前时间
DO $$
DECLARE
    test_project_id UUID;
    old_updated_at TIMESTAMP;
    new_updated_at TIMESTAMP;
BEGIN
    -- 获取第一个项目的 ID
    SELECT id INTO test_project_id FROM projects LIMIT 1;
    
    IF test_project_id IS NOT NULL THEN
        -- 获取更新前的时间
        SELECT updated_at INTO old_updated_at FROM projects WHERE id = test_project_id;
        
        -- 等待 1 秒
        PERFORM pg_sleep(1);
        
        -- 更新项目
        UPDATE projects SET name = name WHERE id = test_project_id;
        
        -- 获取更新后的时间
        SELECT updated_at INTO new_updated_at FROM projects WHERE id = test_project_id;
        
        -- 显示结果
        RAISE NOTICE '项目 ID: %', test_project_id;
        RAISE NOTICE '更新前时间: %', old_updated_at;
        RAISE NOTICE '更新后时间: %', new_updated_at;
        
        IF new_updated_at > old_updated_at THEN
            RAISE NOTICE '✓ 触发器工作正常：updated_at 已自动更新';
        ELSE
            RAISE NOTICE '✗ 触发器异常：updated_at 未更新';
        END IF;
    ELSE
        RAISE NOTICE '没有找到测试项目，请先运行 seed.sql';
    END IF;
END $$;
\echo ''

-- 显示表大小
\echo '=========================================='
\echo '表大小统计'
\echo '=========================================='
SELECT
    pg_size_pretty(pg_total_relation_size('projects')) as total_size,
    pg_size_pretty(pg_relation_size('projects')) as table_size,
    pg_size_pretty(pg_indexes_size('projects')) as indexes_size;
\echo ''

-- 完成
\echo '=========================================='
\echo '测试完成'
\echo '=========================================='
\echo '如果所有测试都通过，数据库配置正确！'
\echo ''
