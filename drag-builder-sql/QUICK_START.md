# 快速开始

## 一键安装

```bash
cd drag-builder-sql
chmod +x setup.sh
./setup.sh
```

脚本会自动检测您的环境（Docker 或本地 PostgreSQL）并完成初始化。

## 手动安装

### Docker 环境

```bash
# 初始化表结构
docker exec -i <容器名> psql -U <用户> -d dragbuilder < init.sql

# 插入示例数据（可选）
docker exec -i <容器名> psql -U <用户> -d dragbuilder < seed.sql

# 连接数据库
docker exec -it <容器名> psql -U <用户> -d dragbuilder
```

### 本地环境

```bash
# 创建数据库
psql -U postgres -c "CREATE DATABASE dragbuilder OWNER onism;"

# 初始化表结构
psql -U onism -d dragbuilder -f init.sql

# 插入示例数据（可选）
psql -U onism -d dragbuilder -f seed.sql

# 连接数据库
psql -U onism -d dragbuilder
```

## 环境变量

在后端项目中配置：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=onism
DB_PASSWORD=123456
DB_DATABASE=dragbuilder
```

## 测试连接

```bash
# Docker
docker exec <容器名> psql -U onism -d dragbuilder -c "SELECT COUNT(*) FROM projects;"

# 本地
psql -U onism -d dragbuilder -c "SELECT COUNT(*) FROM projects;"
```

详细文档请查看 [README.md](README.md)
