# DragBuilder 数据库配置

## 概述

本目录包含 DragBuilder 项目的 PostgreSQL 数据库初始化脚本和示例数据。支持 Docker 和本地 PostgreSQL 环境。

## 数据库配置

### 连接信息

- **数据库类型**: PostgreSQL 16+
- **主机**: localhost
- **端口**: 5432
- **数据库名**: dragbuilder
- **用户名**: onism
- **密码**: 123456

### 环境变量配置

在后端项目（drag-builder-server）中配置以下环境变量：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=onism
DB_PASSWORD=123456
DB_DATABASE=dragbuilder
```

## 快速开始

### 自动安装（推荐）

运行自动化设置脚本（支持 Docker 和本地环境）：

```bash
cd drag-builder-sql
chmod +x setup.sh
./setup.sh
```

脚本会自动检测环境并引导您完成初始化。

### 手动安装

#### Docker 环境

如果您使用 Docker 部署的 PostgreSQL（如 pgvector）：

```bash
# 1. 确保容器运行
docker ps | grep postgres

# 2. 创建数据库（如果不存在）
docker exec <容器名> psql -U <用户> -c "CREATE DATABASE dragbuilder OWNER <用户>;"

# 3. 初始化表结构
docker exec -i <容器名> psql -U <用户> -d dragbuilder < init.sql

# 4. 插入示例数据（可选）
docker exec -i <容器名> psql -U <用户> -d dragbuilder < seed.sql

# 5. 测试连接
docker exec -it <容器名> psql -U <用户> -d dragbuilder
```

#### 本地环境

如果您使用本地安装的 PostgreSQL：

```bash
# 1. 创建用户和数据库
psql -U postgres -c "CREATE USER onism WITH PASSWORD '123456';"
psql -U postgres -c "CREATE DATABASE dragbuilder OWNER onism;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE dragbuilder TO onism;"

# 2. 初始化表结构
psql -U onism -d dragbuilder -f init.sql

# 3. 插入示例数据（可选）
psql -U onism -d dragbuilder -f seed.sql

# 4. 测试连接
psql -U onism -d dragbuilder
```

## 数据库 Schema

### projects 表结构

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 项目唯一标识符（主键） |
| name | VARCHAR(255) | 项目名称 |
| canvas_config | JSONB | 画布配置（宽高、缩放、平移等） |
| components_tree | JSONB | 组件树 DSL（所有组件节点） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 索引

- `idx_projects_name`: 优化按名称搜索
- `idx_projects_created_at`: 优化按创建时间排序
- `idx_projects_updated_at`: 优化按更新时间排序
- `idx_projects_canvas_config`: 优化 JSONB 查询（GIN 索引）
- `idx_projects_components_tree`: 优化 JSONB 查询（GIN 索引）

### 触发器

- `trigger_update_projects_updated_at`: 自动更新 `updated_at` 字段

## 示例数据

`seed.sql` 脚本包含 4 个示例项目：

1. **登录页面示例**（桌面端 1440x900）
2. **产品卡片示例**（移动端 375x667）
3. **空白画布**（平板端 768x1024）
4. **仪表盘布局**（桌面端 1440x900）

## 常用命令

### 连接数据库

```bash
# Docker 环境
docker exec -it <容器名> psql -U onism -d dragbuilder

# 本地环境
psql -U onism -d dragbuilder
```

### 查看表结构

```sql
\d projects
```

### 查看所有项目

```sql
SELECT id, name, created_at FROM projects ORDER BY created_at DESC;
```

### 查看项目详情

```sql
SELECT * FROM projects WHERE id = '<项目ID>';
```

### 查询画布配置

```sql
SELECT 
    name,
    canvas_config->>'width' as width,
    canvas_config->>'height' as height,
    canvas_config->>'preset' as preset
FROM projects;
```

### 查询组件数量

```sql
SELECT 
    name,
    jsonb_array_length(components_tree) as component_count
FROM projects;
```

### 清空所有数据

```sql
TRUNCATE TABLE projects RESTART IDENTITY CASCADE;
```

## 备份和恢复

### 备份数据库

```bash
# Docker 环境
docker exec <容器名> pg_dump -U onism dragbuilder > backup.sql

# 本地环境
pg_dump -U onism -d dragbuilder -F c -f dragbuilder_backup.dump
```

### 恢复数据库

```bash
# Docker 环境
cat backup.sql | docker exec -i <容器名> psql -U onism -d dragbuilder

# 本地环境
pg_restore -U onism -d dragbuilder -c dragbuilder_backup.dump
```

## 故障排查

### Docker 环境

**问题：容器无法连接**
```bash
# 检查容器状态
docker ps | grep postgres

# 查看容器日志
docker logs <容器名>

# 重启容器
docker restart <容器名>
```

### 本地环境

**问题：连接失败**
```bash
# 检查服务状态（macOS）
brew services list

# 检查服务状态（Linux）
sudo systemctl status postgresql

# 启动服务
brew services start postgresql@16  # macOS
sudo systemctl start postgresql    # Linux
```

**问题：权限错误**
```sql
-- 重新授予权限
GRANT ALL PRIVILEGES ON DATABASE dragbuilder TO onism;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO onism;
```

## 文件说明

- `init.sql` - 数据库表结构初始化脚本
- `seed.sql` - 示例数据插入脚本
- `test-connection.sql` - 连接测试脚本
- `setup.sh` - 自动化设置脚本（支持 Docker 和本地环境）
- `.env.example` - 环境变量配置示例
- `README.md` - 本文档

## 注意事项

1. **生产环境安全**：
   - 不要使用默认密码 `123456`
   - 使用强密码并定期更换
   - 限制数据库访问 IP
   - 启用 SSL 连接

2. **性能优化**：
   - 定期执行 `VACUUM ANALYZE` 优化性能
   - 监控索引使用情况
   - 根据查询模式调整索引策略

3. **数据备份**：
   - 定期备份数据库
   - 测试恢复流程
   - 保留多个备份版本
