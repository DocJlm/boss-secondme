# SecondMe AI 招聘应用

基于 SecondMe API 开发的 AI 招聘匹配应用，实现候选人与招聘方的智能匹配和对话。

## 项目概述

本项目是一个基于 Next.js 和 SecondMe API 的 AI 招聘平台，主要功能包括：

- **OAuth2 认证**：使用 SecondMe OAuth2 进行用户登录和授权
- **双向匹配**：候选人和招聘方可以互相浏览和匹配
- **AI 对话匹配**：两个 SecondMe AI 自动对话，评估匹配度
- **流式对话**：支持实时流式对话响应
- **职位管理**：招聘方可以发布多个职位
- **匹配广场**：类似 Tinder 的卡片式浏览界面

## 技术栈

- **框架**：Next.js 16+ (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **数据库**：PostgreSQL + Prisma ORM
- **API**：SecondMe API (OAuth2 + Chat + User Info)

## 项目结构

```
boss-secondme/
├── src/
│   ├── app/
│   │   ├── api/              # API 路由
│   │   │   ├── auth/         # OAuth2 认证
│   │   │   ├── secondme/     # SecondMe API 代理
│   │   │   ├── ai-match/     # AI 匹配对话
│   │   │   └── ...
│   │   ├── components/       # React 组件
│   │   ├── plaza/            # 匹配广场（候选人/招聘方）
│   │   ├── match/            # 匹配对话页面
│   │   └── ...
│   └── lib/
│       ├── config.ts         # 配置管理（统一 API 端点）
│       ├── types.ts          # 类型定义
│       ├── secondme.ts       # SecondMe API 封装
│       ├── ai-match.ts       # AI 匹配逻辑
│       └── prisma.ts         # Prisma Client
├── prisma/
│   └── schema.prisma         # 数据库模型
└── .env.local               # 环境变量
```

## 核心功能模块

### 1. 认证模块 (`auth`)

- `GET /api/auth/login`：跳转到 SecondMe 授权页
- `GET /api/auth/callback`：处理 OAuth2 回调
- `POST /api/auth/logout`：退出登录

**特点**：
- 自动 Token 刷新
- 安全的 session 管理
- 支持 WebView 环境

### 2. SecondMe API 代理模块 (`secondme`)

- `GET /api/secondme/user/info`：获取用户信息
- `POST /api/secondme/chat/stream`：流式聊天

**特点**：
- 统一配置管理（`src/lib/config.ts`）
- 统一类型定义（`src/lib/types.ts`）
- 统一错误处理

### 3. AI 匹配模块 (`ai-match`)

- `GET /api/ai-match/conversations/[id]/auto`：启动自动对话

**特点**：
- 两个 SecondMe AI 自动对话
- 流式响应实时显示
- 匹配度评分

### 4. 业务模块

- **职位管理**：招聘方发布和管理职位
- **匹配广场**：卡片式浏览界面
- **匹配对话**：查看匹配对话和评分

## 配置管理

根据 Second-Me-Skills 最佳实践，所有配置统一管理在 `src/lib/config.ts`：

```typescript
import { secondmeConfig, getApiUrl } from "@/lib/config";

// 使用配置而非硬编码
const apiUrl = getApiUrl(secondmeConfig.endpoints.userInfo);
```

## 类型定义

统一类型定义在 `src/lib/types.ts`：

```typescript
import type { ApiResponse, UserInfo } from "@/lib/types";

const result: ApiResponse<UserInfo> = await getUserInfo(accessToken);
```

## 环境变量

```env
# SecondMe OAuth2 配置
SECONDME_CLIENT_ID=your_client_id
SECONDME_CLIENT_SECRET=your_client_secret
SECONDME_REDIRECT_URI=http://localhost:3000/api/auth/callback

# SecondMe API
SECONDME_API_BASE_URL=https://app.mindos.com/gate/lab
SECONDME_OAUTH_URL=https://go.second.me/oauth/

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

## 开发规范

### API 调用

1. **使用配置管理**：所有 API 端点从 `config.ts` 读取
2. **统一错误处理**：使用 `ApiResponse<T>` 类型
3. **类型安全**：使用 TypeScript 类型定义

### 代码组织

1. **模块化**：按功能模块组织代码
2. **可复用**：提取公共逻辑到 `lib/`
3. **类型定义**：统一类型定义在 `types.ts`

### 错误处理

```typescript
const result = await apiCall();
if (result.code !== 0) {
  // 处理错误
  console.error(result.message);
  return;
}
// 使用 result.data
```

## 数据库模型

### User（必需）

- `secondmeUserId`：SecondMe 用户 ID（唯一）
- `accessToken` / `refreshToken`：OAuth2 Token
- `tokenExpiresAt`：Token 过期时间
- `avatar` / `name`：SecondMe 用户信息

### 业务模型

- `CandidateProfile`：候选人资料
- `EmployerProfile`：招聘方资料
- `Company`：公司信息
- `Job`：职位信息
- `Match`：匹配记录
- `AIMatchConversation`：AI 匹配对话

## 参考资源

- [SecondMe API 文档](https://develop-docs.second.me/zh/docs)
- [Second-Me-Skills](https://github.com/mindverse/Second-Me-Skills)
- [参考 Demo 1](https://github.com/wuyuxiangX/2026-01-29-secondme-demo1)
- [参考 Demo 2](https://github.com/wuyuxiangX/secondme-demo2)

## 开发注意事项

1. **API 响应格式**：所有 SecondMe API 响应格式为 `{ code: 0, data: {...} }`
2. **Token 管理**：自动刷新 Token，提前 5 分钟刷新
3. **流式响应**：正确处理 SSE 格式，使用 buffer 累积数据
4. **Markdown 渲染**：使用 `react-markdown` 渲染对话内容
5. **配置管理**：使用 `config.ts` 统一管理，避免硬编码

## 启动步骤

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local

# 3. 初始化数据库
npx prisma db push

# 4. 启动开发服务器
npm run dev
```

项目将在 http://localhost:3000 启动。
