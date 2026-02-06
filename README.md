# Boss SecondMe - AI 招聘匹配应用

基于 SecondMe API 开发的 AI 招聘匹配应用，实现候选人与招聘方的智能匹配和对话。

## 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（创建 .env.local 文件）
# 参考 .env.example 或查看 doc/DEPLOY.md

# 3. 初始化数据库
npx prisma migrate deploy
# 或
npx prisma db push

# 4. 生成 Prisma Client
npx prisma generate

# 5. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 部署到 Vercel

**详细部署指南：** 查看 [../doc/DEPLOY.md](../doc/DEPLOY.md) 获取完整的部署步骤（小白友好版）

**快速检查清单：** 查看 [../doc/QUICK_START.md](../doc/QUICK_START.md) 获取快速部署检查清单

部署步骤概览：
1. 准备 PostgreSQL 数据库
2. 本地测试构建：`npm run build`
3. 配置环境变量
4. 推送到 GitHub
5. 在 Vercel 导入项目并配置
6. 部署后更新 Redirect URI

## 项目特性

- ✅ OAuth2 认证（SecondMe）
- ✅ 双向匹配（候选人和招聘方）
- ✅ AI 对话匹配（两个 SecondMe AI 自动对话）
- ✅ 流式对话响应
- ✅ 职位管理
- ✅ 匹配广场（类似 Tinder 的卡片式浏览）

## 技术栈

- **Next.js 16** - React 框架，使用 App Router
- **TypeScript** - 类型安全
- **Tailwind CSS** - 实用优先的 CSS 框架
- **PostgreSQL** - 关系型数据库
- **Prisma** - 现代化 ORM
- **SecondMe API** - OAuth2 + Chat + User Info

## 项目文档

- [开发指南](./SECONDME_DEVELOPMENT_GUIDE.md) - 详细的开发文档
- [部署指南](../doc/DEPLOY.md) - 完整的部署步骤
- [快速开始](../doc/QUICK_START.md) - 快速部署检查清单
- [CLAUDE.md](./CLAUDE.md) - 项目配置说明

## 环境变量

```env
# SecondMe OAuth2 配置
SECONDME_CLIENT_ID=your_client_id
SECONDME_CLIENT_SECRET=your_client_secret
SECONDME_REDIRECT_URI=http://localhost:3000/api/auth/callback

# SecondMe API 配置
SECONDME_API_BASE_URL=https://app.mindos.com/gate/lab
SECONDME_OAUTH_URL=https://go.second.me/oauth/

# 数据库
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Next.js 配置（可选）
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 参考资源

- [SecondMe API 文档](https://develop-docs.second.me/zh/docs)
- [Second-Me-Skills](https://github.com/mindverse/Second-Me-Skills)
- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
