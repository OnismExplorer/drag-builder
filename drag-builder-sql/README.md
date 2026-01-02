# DragBuilder 数据库脚本

这是 DragBuilder 的数据库初始化和种子数据脚本。

## 数据库信息

- **数据库**: PostgreSQL 16+
- **数据库名**: dragbuilder
- **用户**: onism
- **密码**: 123456
- **端口**: 5432

## 文件说明

- `init.sql` - 数据库初始化脚本（创建表和索引）
- `seed.sql` - 种子数据脚本（插入示例数据）

## 数据库 Schema

### projects 表

存储用户创建的项目数据。

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | UUID | PRIMARY KEY | 项目唯一标识 |
| name | VARCHAR(255) | NOT NULL | 项目名称 |
| canvas_config | JSONB | NOT NULL | 画布配置（宽高、缩放、平移） |
| components_tree | JSONB | NOT NULL | 组件树 DSL |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 更新时间 |

### 索引

- `idx_projects_name` - 项目名称索引（优化搜索）
- `idx_projects_created_at` - 创建时间索引（优化排序）

### JSONB 字段说明

#### canvas_config 结构

```json
{
  "width": 1440,
  "height": 900,
  "preset": "desktop",
  "backgroundColor": "#FFFFFF"
}
```

#### components_tree 结构

```json
[
  {
    "id": "uuid-v4",
    "type": "div",
    "position": {
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 100,
      "zIndex": 1
    },
    "styles": {
      "backgroundColor": "#FFFFFF",
      "borderColor": "#E2E8F0",
      "borderWidth": 1,
      "borderRadius": 16
    },
    "content": {}
  }
]
```

## 初始化步骤

### 1. 安装 PostgreSQL

确保已安装 PostgreSQL 16 或更高版本。

### 2. 创建数据库用户（如果不存在）

```sql
CREATE USER onism WITH PASSWORD '123456';
ALTER USER onism CREATEDB;
```

### 3. 创建数据库

```sql
CREATE DATABASE dragbuilder OWNER onism;
```

### 4. 执行初始化脚本

```bash
# 方式 1: 使用 psql 命令行
psql -U onism -d dragbuilder -f init.sql

# 方式 2: 在 psql 交互式环境中
psql -U onism -d dragbuilder
\i init.sql
```

### 5. 执行种子数据脚本（可选）

```bash
psql -U onism -d dragbuilder -f seed.sql
```

## 验证安装

连接到数据库并检查表：

```sql
-- 连接到数据库
psql -U onism -d dragbuilder

-- 查看所有表
\dt

-- 查看 projects 表结构
\d projects

-- 查看索引
\di

-- 查询示例数据
SELECT id, name, created_at FROM projects;
```

## 数据库维护

### 备份数据库

```bash
pg_dump -U onism -d dragbuilder -F c -f dragbuilder_backup.dump
```

### 恢复数据库

```bash
pg_restore -U onism -d dragbuilder -c dragbuilder_backup.dump
```

### 清空数据

```sql
TRUNCATE TABLE projects CASCADE;
```

### 删除数据库

```sql
DROP DATABASE dragbuilder;
```

## 性能优化

### JSONB 索引

如果需要频繁查询 JSONB 字段，可以创建 GIN 索引：

```sql
-- 为 canvas_config 创建 GIN 索引
CREATE INDEX idx_projects_canvas_config ON projects USING GIN (canvas_config);

-- 为 components_tree 创建 GIN 索引
CREATE INDEX idx_projects_components_tree ON projects USING GIN (components_tree);
```

### 查询示例

```sql
-- 查询特定画布尺寸的项目
SELECT * FROM projects 
WHERE canvas_config->>'width' = '1440';

-- 查询包含特定组件类型的项目
SELECT * FROM projects 
WHERE components_tree @> '[{"type": "button"}]';
```

## 注意事项

1. **生产环境**: 请务必修改默认密码
2. **备份**: 定期备份数据库
3. **权限**: 确保数据库用户权限最小化
4. **连接池**: 配置合适的连接池大小
5. **监控**: 监控数据库性能和慢查询

## 故障排查

### 连接失败

```bash
# 检查 PostgreSQL 服务状态
pg_ctl status

# 检查端口占用
netstat -an | findstr 5432

# 检查配置文件
# postgresql.conf - listen_addresses
# pg_hba.conf - 客户端认证
```

### 权限问题

```sql
-- 授予所有权限
GRANT ALL PRIVILEGES ON DATABASE dragbuilder TO onism;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO onism;
```

---

**注意**: 本数据库配置仅用于开发环境，生产环境请加强安全配置。
