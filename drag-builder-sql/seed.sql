-- ============================================
-- DragBuilder 数据库种子数据脚本
-- ============================================
-- 功能：插入示例项目数据用于开发和测试
-- 数据库：PostgreSQL 16+
-- ============================================

-- ============================================
-- 清空现有数据（开发环境使用）
-- ============================================
TRUNCATE TABLE projects RESTART IDENTITY CASCADE;

-- ============================================
-- 插入示例项目 1：简单的登录页面
-- ============================================
INSERT INTO projects (id, name, canvas_config, components_tree, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '登录页面示例',
    '{
        "width": 1440,
        "height": 900,
        "preset": "desktop",
        "backgroundColor": "#FFFFFF"
    }'::jsonb,
    '[
        {
            "id": "comp-001",
            "type": "div",
            "position": {
                "x": 520,
                "y": 250,
                "width": 400,
                "height": 400,
                "zIndex": 0
            },
            "styles": {
                "backgroundColor": "#FFFFFF",
                "borderColor": "#E2E8F0",
                "borderWidth": 1,
                "borderRadius": 16,
                "padding": 32
            },
            "content": {}
        },
        {
            "id": "comp-002",
            "type": "text",
            "position": {
                "x": 620,
                "y": 280,
                "width": 200,
                "height": 40,
                "zIndex": 1
            },
            "styles": {
                "textColor": "#0F172A",
                "fontSize": 24,
                "fontWeight": 600
            },
            "content": {
                "text": "欢迎登录"
            }
        },
        {
            "id": "comp-003",
            "type": "input",
            "position": {
                "x": 560,
                "y": 360,
                "width": 320,
                "height": 40,
                "zIndex": 1
            },
            "styles": {
                "borderColor": "#CBD5E1",
                "borderWidth": 1,
                "borderRadius": 8,
                "padding": 12
            },
            "content": {
                "placeholder": "请输入用户名"
            }
        },
        {
            "id": "comp-004",
            "type": "input",
            "position": {
                "x": 560,
                "y": 420,
                "width": 320,
                "height": 40,
                "zIndex": 1
            },
            "styles": {
                "borderColor": "#CBD5E1",
                "borderWidth": 1,
                "borderRadius": 8,
                "padding": 12
            },
            "content": {
                "placeholder": "请输入密码"
            }
        },
        {
            "id": "comp-005",
            "type": "button",
            "position": {
                "x": 560,
                "y": 490,
                "width": 320,
                "height": 44,
                "zIndex": 1
            },
            "styles": {
                "backgroundColor": "#C2410C",
                "textColor": "#FFFFFF",
                "borderRadius": 8,
                "fontSize": 16,
                "fontWeight": 500
            },
            "content": {
                "text": "登录"
            }
        }
    ]'::jsonb,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
);

-- ============================================
-- 插入示例项目 2：产品展示卡片
-- ============================================
INSERT INTO projects (id, name, canvas_config, components_tree, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '产品卡片示例',
    '{
        "width": 375,
        "height": 667,
        "preset": "mobile",
        "backgroundColor": "#F8FAFC"
    }'::jsonb,
    '[
        {
            "id": "comp-101",
            "type": "div",
            "position": {
                "x": 20,
                "y": 100,
                "width": 335,
                "height": 450,
                "zIndex": 0
            },
            "styles": {
                "backgroundColor": "#FFFFFF",
                "borderRadius": 16,
                "padding": 0
            },
            "content": {}
        },
        {
            "id": "comp-102",
            "type": "image",
            "position": {
                "x": 20,
                "y": 100,
                "width": 335,
                "height": 250,
                "zIndex": 1
            },
            "styles": {
                "borderRadius": 16
            },
            "content": {
                "src": "https://via.placeholder.com/335x250",
                "alt": "产品图片"
            }
        },
        {
            "id": "comp-103",
            "type": "text",
            "position": {
                "x": 40,
                "y": 370,
                "width": 295,
                "height": 30,
                "zIndex": 1
            },
            "styles": {
                "textColor": "#0F172A",
                "fontSize": 20,
                "fontWeight": 600
            },
            "content": {
                "text": "精选产品"
            }
        },
        {
            "id": "comp-104",
            "type": "text",
            "position": {
                "x": 40,
                "y": 410,
                "width": 295,
                "height": 60,
                "zIndex": 1
            },
            "styles": {
                "textColor": "#64748B",
                "fontSize": 14,
                "fontWeight": 400
            },
            "content": {
                "text": "这是一个精心设计的产品，具有出色的性能和优雅的外观。"
            }
        },
        {
            "id": "comp-105",
            "type": "button",
            "position": {
                "x": 40,
                "y": 490,
                "width": 295,
                "height": 40,
                "zIndex": 1
            },
            "styles": {
                "backgroundColor": "#C2410C",
                "textColor": "#FFFFFF",
                "borderRadius": 8,
                "fontSize": 16,
                "fontWeight": 500
            },
            "content": {
                "text": "立即购买"
            }
        }
    ]'::jsonb,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
);

-- ============================================
-- 插入示例项目 3：空白画布
-- ============================================
INSERT INTO projects (id, name, canvas_config, components_tree, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    '空白画布',
    '{
        "width": 768,
        "height": 1024,
        "preset": "tablet",
        "backgroundColor": "#FFFFFF"
    }'::jsonb,
    '[]'::jsonb,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '3 hours'
);

-- ============================================
-- 插入示例项目 4：复杂布局示例
-- ============================================
INSERT INTO projects (id, name, canvas_config, components_tree, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440004',
    '仪表盘布局',
    '{
        "width": 1440,
        "height": 900,
        "preset": "desktop",
        "backgroundColor": "#F1F5F9"
    }'::jsonb,
    '[
        {
            "id": "comp-201",
            "type": "div",
            "position": {
                "x": 50,
                "y": 50,
                "width": 300,
                "height": 200,
                "zIndex": 0
            },
            "styles": {
                "backgroundColor": "#FFFFFF",
                "borderRadius": 16,
                "padding": 24
            },
            "content": {}
        },
        {
            "id": "comp-202",
            "type": "text",
            "position": {
                "x": 74,
                "y": 74,
                "width": 252,
                "height": 30,
                "zIndex": 1
            },
            "styles": {
                "textColor": "#0F172A",
                "fontSize": 18,
                "fontWeight": 600
            },
            "content": {
                "text": "总销售额"
            }
        },
        {
            "id": "comp-203",
            "type": "text",
            "position": {
                "x": 74,
                "y": 120,
                "width": 252,
                "height": 50,
                "zIndex": 1
            },
            "styles": {
                "textColor": "#C2410C",
                "fontSize": 36,
                "fontWeight": 700
            },
            "content": {
                "text": "¥128,456"
            }
        },
        {
            "id": "comp-204",
            "type": "div",
            "position": {
                "x": 380,
                "y": 50,
                "width": 300,
                "height": 200,
                "zIndex": 0
            },
            "styles": {
                "backgroundColor": "#FFFFFF",
                "borderRadius": 16,
                "padding": 24
            },
            "content": {}
        },
        {
            "id": "comp-205",
            "type": "text",
            "position": {
                "x": 404,
                "y": 74,
                "width": 252,
                "height": 30,
                "zIndex": 1
            },
            "styles": {
                "textColor": "#0F172A",
                "fontSize": 18,
                "fontWeight": 600
            },
            "content": {
                "text": "新增用户"
            }
        },
        {
            "id": "comp-206",
            "type": "text",
            "position": {
                "x": 404,
                "y": 120,
                "width": 252,
                "height": 50,
                "zIndex": 1
            },
            "styles": {
                "textColor": "#0EA5E9",
                "fontSize": 36,
                "fontWeight": 700
            },
            "content": {
                "text": "1,234"
            }
        },
        {
            "id": "comp-207",
            "type": "div",
            "position": {
                "x": 710,
                "y": 50,
                "width": 300,
                "height": 200,
                "zIndex": 0
            },
            "styles": {
                "backgroundColor": "#FFFFFF",
                "borderRadius": 16,
                "padding": 24
            },
            "content": {}
        },
        {
            "id": "comp-208",
            "type": "text",
            "position": {
                "x": 734,
                "y": 74,
                "width": 252,
                "height": 30,
                "zIndex": 1
            },
            "styles": {
                "textColor": "#0F172A",
                "fontSize": 18,
                "fontWeight": 600
            },
            "content": {
                "text": "活跃订单"
            }
        },
        {
            "id": "comp-209",
            "type": "text",
            "position": {
                "x": 734,
                "y": 120,
                "width": 252,
                "height": 50,
                "zIndex": 1
            },
            "styles": {
                "textColor": "#10B981",
                "fontSize": 36,
                "fontWeight": 700
            },
            "content": {
                "text": "89"
            }
        }
    ]'::jsonb,
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '1 hour'
);

-- ============================================
-- 验证插入的数据
-- ============================================
-- 查询所有项目
SELECT 
    id,
    name,
    canvas_config->>'width' as canvas_width,
    canvas_config->>'height' as canvas_height,
    jsonb_array_length(components_tree) as component_count,
    created_at,
    updated_at
FROM projects
ORDER BY created_at DESC;

-- ============================================
-- 完成
-- ============================================
-- 种子数据插入完成
-- 已插入 4 个示例项目：
-- 1. 登录页面示例（桌面端）
-- 2. 产品卡片示例（移动端）
-- 3. 空白画布（平板端）
-- 4. 仪表盘布局（桌面端）
