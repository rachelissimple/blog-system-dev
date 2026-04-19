# Vercel 部署指南

本指南将帮助您将个人博客系统部署到 Vercel 平台。

## 📋 部署前准备

### 1. 代码提交到 Git 仓库
确保所有代码已提交到 GitHub、GitLab 或 Bitbucket。

```bash
git add .
git commit -m "准备 Vercel 部署"
git push origin main
```

### 2. 准备生产环境配置
复制示例配置文件并填写实际值：

```bash
# 复制示例配置
cp .env.production.example .env.production

# 编辑配置文件，填写以下信息：
# DATABASE_URL - PostgreSQL 数据库连接字符串
# JWT_SECRET - 强随机密钥（使用 openssl rand -base64 32 生成）
# ADMIN_EMAILS - 管理员邮箱（用逗号分隔）
```

## 🗄️ 数据库设置（关键步骤）

Vercel 无服务器环境不支持 SQLite，必须使用 PostgreSQL。推荐以下方案：

### 方案A：Vercel Postgres（最简单）
1. 在 Vercel 控制台创建新项目
2. 在 "Storage" 选项卡中选择 "PostgreSQL"
3. 创建数据库，Vercel 会自动提供 `DATABASE_URL`
4. 复制该 URL 到您的环境变量

### 方案B：Supabase（免费额度大）
1. 访问 [supabase.com](https://supabase.com) 注册
2. 创建新项目 → 获取数据库连接字符串
3. 格式：`postgresql://postgres:[密码]@db.[项目].supabase.co:5432/postgres`

### 方案C：Neon（面向开发者的 PostgreSQL）
1. 访问 [neon.tech](https://neon.tech) 注册
2. 创建项目 → 获取连接字符串
3. 支持无服务器自动暂停，成本优化

## 🚀 Vercel 部署步骤

### 第1步：注册并登录 Vercel
访问 [vercel.com](https://vercel.com)，使用 GitHub/GitLab 账号登录。

### 第2步：导入项目
1. 点击 "New Project"
2. 连接您的 Git 仓库
3. 选择博客系统项目

### 第3步：配置项目设置
- **Framework Preset**: Next.js（自动检测）
- **Build Command**: `npm run vercel-build`（已配置）
- **Output Directory**: `.next`（默认）
- **Install Command**: `npm ci`（推荐）

### 第4步：配置环境变量
在项目设置中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `postgresql://...` | PostgreSQL 连接字符串 |
| `JWT_SECRET` | 强随机字符串 | 认证密钥 |
| `ADMIN_EMAILS` | `2161604566@qq.com` | 管理员邮箱 |
| `NODE_ENV` | `production` | 生产环境 |

### 第5步：部署
1. 点击 "Deploy"
2. 等待构建完成（约2-3分钟）
3. 获取分配的域名（如：`xxx.vercel.app`）

## 🔧 数据库迁移

部署完成后，需要运行数据库迁移：

### 方法1：通过 Vercel CLI（推荐）
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 设置环境变量（如果未在控制台设置）
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add ADMIN_EMAILS

# 运行迁移
npx prisma migrate deploy
```

### 方法2：通过 Prisma Studio
```bash
# 临时设置环境变量
export DATABASE_URL="你的数据库连接字符串"

# 运行迁移
npx prisma migrate deploy

# 或使用 Prisma Studio 查看数据
npx prisma studio
```

### 方法3：通过脚本
创建 `scripts/migrate.js`：
```javascript
const { execSync } = require('child_process');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });
```

## 🌐 自定义域名（可选）

### 步骤：
1. 在 Vercel 项目设置 → Domains
2. 添加您的域名（如：`blog.yourdomain.com`）
3. 按照提示配置 DNS 记录
4. 等待 SSL 证书自动签发

## 📊 数据迁移（从 SQLite 到 PostgreSQL）

如果已有 SQLite 数据需要迁移：

### 方法：使用 Prisma 迁移工具
```bash
# 1. 备份 SQLite 数据
cp prisma/dev.db prisma/dev.db.backup

# 2. 导出 SQLite 数据为 SQL
sqlite3 prisma/dev.db .dump > dump.sql

# 3. 转换 SQL 格式（手动调整或使用工具）
# 注意：需要将 SQLite 语法转换为 PostgreSQL 语法

# 4. 导入到 PostgreSQL
psql "你的数据库连接字符串" -f dump.sql
```

### 简化方案：重新开始
如果数据不重要，建议重新开始：
1. 新数据库自动创建表结构
2. 重新注册用户
3. 重新创建文章

## 🛡️ 生产环境安全检查

### 1. JWT 密钥
- 使用强随机字符串：`openssl rand -base64 32`
- 定期轮换密钥

### 2. 数据库安全
- 启用 SSL 连接
- 限制数据库公网访问（使用 IP 白名单）
- 定期备份

### 3. HTTPS
- Vercel 自动提供 HTTPS
- 确保所有流量重定向到 HTTPS

### 4. CORS 配置
如果需要 API 访问，配置 `next.config.js`：
```javascript
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ]
      }
    ]
  }
}
```

## 🔍 故障排除

### 构建失败
1. **错误**: "Prisma not found"
   - 解决方案：确保 `prisma generate` 在构建前运行
   - 检查 `vercel-build` 脚本配置

2. **错误**: "Database connection failed"
   - 检查 `DATABASE_URL` 格式
   - 确认数据库可公开访问（Vercel IP 白名单）

3. **错误**: "JWT secret not set"
   - 确保 `JWT_SECRET` 环境变量已设置

### 运行时错误
1. **API 返回 500**
   - 检查 Vercel 函数日志
   - 确认数据库迁移已运行

2. **静态资源加载失败**
   - 检查 `next.config.js` 配置
   - 确认构建输出正确

### 数据库问题
1. **迁移失败**
   ```bash
   # 重置数据库（谨慎使用，会删除所有数据）
   npx prisma migrate reset
   
   # 重新运行迁移
   npx prisma migrate deploy
   ```

2. **连接超时**
   - 检查数据库连接限制
   - 考虑使用连接池

## 📈 性能优化

### Vercel 特定优化
1. **启用 Edge Functions**（如果适用）
2. **使用 Image Optimization**
3. **配置缓存头**

### 数据库优化
1. **添加索引**（已包含在 Prisma schema 中）
2. **启用连接池**
3. **定期清理旧数据**

## 📞 获取帮助

1. **Vercel 文档**: https://vercel.com/docs
2. **Prisma 文档**: https://www.prisma.io/docs
3. **Next.js 文档**: https://nextjs.org/docs

## ✅ 部署检查清单

- [ ] 代码推送到 Git 仓库
- [ ] 创建 PostgreSQL 数据库
- [ ] 配置环境变量
- [ ] Vercel 项目导入成功
- [ ] 构建通过
- [ ] 数据库迁移完成
- [ ] 测试网站功能
- [ ] 配置自定义域名（可选）
- [ ] 设置监控告警（可选）

---

**恭喜！** 您的博客系统现已上线。如有问题，请参考本文档或联系技术支持。