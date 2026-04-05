#!/bin/bash

# ============================================
# DragBuilder 数据库快速设置脚本
# ============================================
# 功能：自动化数据库初始化流程（支持 Docker 和本地环境）
# 使用方法：chmod +x setup.sh && ./setup.sh
# ============================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 数据库配置
DB_USER="onism"
DB_PASSWORD="123456"
DB_NAME="dragbuilder"
DB_HOST="localhost"
DB_PORT="5432"

# 检测环境类型
USE_DOCKER=false
DOCKER_CONTAINER=""

echo -e "${BLUE}=========================================="
echo "DragBuilder 数据库设置"
echo -e "==========================================${NC}"
echo ""

# 检测 Docker 环境
echo -e "${YELLOW}[1/7] 检测环境...${NC}"
if command -v docker &> /dev/null; then
    # 查找 PostgreSQL 容器
    CONTAINERS=$(docker ps --format "{{.Names}}" | grep -iE "pgvector|postgres" || true)
    if [ -n "$CONTAINERS" ]; then
        echo -e "${GREEN}✓ 检测到 Docker 容器${NC}"
        echo "找到以下容器："
        echo "$CONTAINERS"
        echo ""
        read -p "是否使用 Docker 环境？(y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            USE_DOCKER=true
            if [ $(echo "$CONTAINERS" | wc -l) -eq 1 ]; then
                DOCKER_CONTAINER="$CONTAINERS"
            else
                echo "请输入要使用的容器名称："
                read -r DOCKER_CONTAINER
            fi
            echo -e "${GREEN}✓ 使用 Docker 容器：${DOCKER_CONTAINER}${NC}"
        fi
    fi
fi

if [ "$USE_DOCKER" = false ]; then
    echo -e "${GREEN}✓ 使用本地 PostgreSQL${NC}"
    # 检查本地 PostgreSQL 是否安装
    if ! command -v psql &> /dev/null; then
        echo -e "${RED}✗ PostgreSQL 未安装${NC}"
        echo "请先安装 PostgreSQL 16+："
        echo "  macOS:   brew install postgresql@16"
        echo "  Ubuntu:  sudo apt install postgresql-16"
        echo "  Windows: https://www.postgresql.org/download/windows/"
        exit 1
    fi
    psql --version
fi
echo ""

# 检查服务状态
echo -e "${YELLOW}[2/7] 检查数据库服务状态...${NC}"
if [ "$USE_DOCKER" = true ]; then
    if docker exec "$DOCKER_CONTAINER" psql -U postgres -c "SELECT 1;" &> /dev/null || \
       docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✓ Docker 容器数据库服务正常${NC}"
    else
        echo -e "${RED}✗ 无法连接到 Docker 容器数据库${NC}"
        exit 1
    fi
else
    if pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL 服务正在运行${NC}"
    else
        echo -e "${RED}✗ PostgreSQL 服务未运行${NC}"
        echo "请启动 PostgreSQL 服务："
        echo "  macOS:   brew services start postgresql@16"
        echo "  Linux:   sudo systemctl start postgresql"
        exit 1
    fi
fi
echo ""

# 创建数据库用户和数据库
echo -e "${YELLOW}[3/7] 创建数据库用户和数据库...${NC}"

if [ "$USE_DOCKER" = true ]; then
    # Docker 环境
    # 尝试使用 postgres 用户或已配置的用户
    ADMIN_USER="postgres"
    if ! docker exec "$DOCKER_CONTAINER" psql -U postgres -c "SELECT 1;" &> /dev/null; then
        ADMIN_USER="$DB_USER"
    fi
    
    docker exec "$DOCKER_CONTAINER" psql -U "$ADMIN_USER" -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "用户 $DB_USER 可能已存在"
    docker exec "$DOCKER_CONTAINER" psql -U "$ADMIN_USER" -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "数据库 $DB_NAME 可能已存在"
    docker exec "$DOCKER_CONTAINER" psql -U "$ADMIN_USER" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
else
    # 本地环境
    echo "请输入 PostgreSQL 超级用户密码（通常是 postgres 用户）："
    psql -U postgres -h $DB_HOST -p $DB_PORT -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "用户 $DB_USER 可能已存在"
    psql -U postgres -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "数据库 $DB_NAME 可能已存在"
    psql -U postgres -h $DB_HOST -p $DB_PORT -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null
fi

echo -e "${GREEN}✓ 数据库用户和数据库已准备就绪${NC}"
echo ""

# 初始化表结构
echo -e "${YELLOW}[4/7] 初始化数据库表结构...${NC}"
export PGPASSWORD=$DB_PASSWORD

if [ "$USE_DOCKER" = true ]; then
    if docker exec -i "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < init.sql > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 表结构初始化成功${NC}"
    else
        echo -e "${RED}✗ 表结构初始化失败${NC}"
        exit 1
    fi
else
    if psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f init.sql > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 表结构初始化成功${NC}"
    else
        echo -e "${RED}✗ 表结构初始化失败${NC}"
        exit 1
    fi
fi
echo ""

# 插入示例数据
echo -e "${YELLOW}[5/7] 插入示例数据...${NC}"
read -p "是否插入示例数据？(y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ "$USE_DOCKER" = true ]; then
        if docker exec -i "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < seed.sql > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 示例数据插入成功${NC}"
        else
            echo -e "${RED}✗ 示例数据插入失败${NC}"
            exit 1
        fi
    else
        if psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f seed.sql > /dev/null 2>&1; then
            echo -e "${GREEN}✓ 示例数据插入成功${NC}"
        else
            echo -e "${RED}✗ 示例数据插入失败${NC}"
            exit 1
        fi
    fi
else
    echo "跳过示例数据插入"
fi
echo ""

# 测试连接
echo -e "${YELLOW}[6/7] 测试数据库连接...${NC}"
if [ "$USE_DOCKER" = true ]; then
    if docker exec -i "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f test-connection.sql > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 数据库连接测试成功${NC}"
    else
        echo -e "${YELLOW}⚠ 连接测试脚本执行完成（可能有警告）${NC}"
    fi
else
    if psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f test-connection.sql > /dev/null 2>&1; then
        echo -e "${GREEN}✓ 数据库连接测试成功${NC}"
    else
        echo -e "${YELLOW}⚠ 连接测试脚本执行完成（可能有警告）${NC}"
    fi
fi
echo ""

# 验证数据
echo -e "${YELLOW}[7/7] 验证数据...${NC}"
if [ "$USE_DOCKER" = true ]; then
    PROJECT_COUNT=$(docker exec "$DOCKER_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM projects;" | tr -d '[:space:]')
else
    PROJECT_COUNT=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT COUNT(*) FROM projects;" | tr -d '[:space:]')
fi
echo -e "${GREEN}✓ 项目数量：${PROJECT_COUNT}${NC}"
echo ""

# 显示连接信息
echo -e "${BLUE}=========================================="
echo "设置完成！"
echo -e "==========================================${NC}"
echo ""
echo "数据库连接信息："
if [ "$USE_DOCKER" = true ]; then
    echo "  环境:     Docker"
    echo "  容器:     $DOCKER_CONTAINER"
fi
echo "  主机:     $DB_HOST"
echo "  端口:     $DB_PORT"
echo "  数据库:   $DB_NAME"
echo "  用户名:   $DB_USER"
echo "  密码:     $DB_PASSWORD"
echo ""
echo "连接命令："
if [ "$USE_DOCKER" = true ]; then
    echo "  docker exec -it $DOCKER_CONTAINER psql -U $DB_USER -d $DB_NAME"
    echo "  或从主机: psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
else
    echo "  psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME"
fi
echo ""
echo "环境变量配置（用于后端项目）："
echo "  DB_HOST=$DB_HOST"
echo "  DB_PORT=$DB_PORT"
echo "  DB_USERNAME=$DB_USER"
echo "  DB_PASSWORD=$DB_PASSWORD"
echo "  DB_DATABASE=$DB_NAME"
echo ""
echo -e "${GREEN}✓ 数据库已准备就绪，可以开始开发！${NC}"
echo ""

# 清除密码环境变量
unset PGPASSWORD
