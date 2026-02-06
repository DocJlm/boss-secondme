# SecondMe 集成开发完整教程

> 本文档详细介绍了如何使用 SecondMe SDK、Skill 和参考示例开发基于 SecondMe API 的 Next.js 全栈应用。

## 目录

- [1. SecondMe API 概述](#1-secondme-api-概述)
- [2. SecondMe Skill 使用指南](#2-secondme-skill-使用指南)
- [3. OAuth2 认证流程详解](#3-oauth2-认证流程详解)
- [4. 项目架构设计](#4-项目架构设计)
- [5. 核心功能实现](#5-核心功能实现)
- [6. 开发流程和范式](#6-开发流程和范式)
- [7. 最佳实践](#7-最佳实践)
- [8. 常见问题与解决方案](#8-常见问题与解决方案)

---

## 1. SecondMe API 概述

### 1.1 什么是 SecondMe API

SecondMe API 是一个提供数字分身（AI Avatar）能力的开放平台，允许你的应用：

- **访问用户授权信息**：获取用户基本信息、头像、兴趣标签等
- **访问用户软记忆**：读取用户的个人知识库
- **流式对话**：以用户的 AI 分身身份进行实时对话

### 1.2 API 基础信息

**Base URL**: `https://app.mindos.com/gate/lab`

**认证方式**：
- **API Key**：适用于服务端调用、后端服务（长期有效）
- **OAuth2**：适用于第三方应用集成（需要用户授权）

### 1.3 权限范围（Scopes）

| Scope | 说明 | 对应 API |
|-------|------|----------|
| `user.info` | 用户基本信息（姓名、邮箱、头像等） | `GET /api/secondme/user/info` |
| `user.info.shades` | 用户兴趣标签 | `GET /api/secondme/user/shades` |
| `user.info.softmemory` | 用户软记忆/知识库 | `GET /api/secondme/user/softmemory` |
| `chat` | 聊天功能 | `POST /api/secondme/chat/stream` |
| `note.add` | 添加笔记/记忆 | `POST /api/secondme/note/add` |
| `voice` | 语音功能（TTS） | `POST /api/secondme/tts/generate` |

### 1.4 API 响应格式

所有 SecondMe API 响应遵循统一格式：

**成功响应**：
```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

**错误响应**：
```json
{
  "code": 400,
  "message": "Error description",
  "subCode": "module.resource.reason"
}
```

---

## 2. SecondMe Skill 使用指南

### 2.1 什么是 SecondMe Skill

SecondMe Skill 是一套 Claude AI 插件工具集，用于快速创建和开发 SecondMe 集成项目。它提供了从项目初始化到代码生成的完整工作流。

### 2.2 Skill 组成

SecondMe Skills 包含以下组件：

#### 2.2.1 `secondme` - 一站式项目创建

**功能**：将初始化、需求定义、项目生成三个步骤合并为一个完整流程。

**调用方式**：
```
/secondme [--quick]
```

**参数说明**：
- 无参数：完整流程（初始化 → PRD → 生成项目）
- `--quick`：快速流程（初始化 → 跳过 PRD → 生成项目）

**执行流程**：

1. **阶段 0：检测当前状态**
   - 检查 `.secondme/state.json` 是否存在
   - 根据 `stage` 字段判断进度，支持断点续传

2. **阶段 1：项目初始化**
   - 收集 App Info 或手动输入凭证
   - 解析 Scopes，推断功能模块
   - 收集数据库连接串
   - 确认模块选择
   - 生成 `.secondme/state.json` 和 `CLAUDE.md`

3. **阶段 2：产品需求定义**（可选）
   - 展示已选模块的 API 能力
   - 收集应用目标和目标用户
   - 根据模块针对性提问
   - 收集设计偏好
   - 确认需求摘要

4. **阶段 3：生成 Next.js 项目**
   - 根据配置和需求生成完整项目
   - 包含认证、API 路由、前端组件等

#### 2.2.2 `secondme-init` - 项目初始化

**功能**：初始化 SecondMe 项目配置和功能模块选择。

**调用方式**：
```
/secondme-init
```

**工作流程**：

1. **检查现有配置**
   - 如果存在 `.secondme/state.json`，显示当前配置摘要
   - 询问是否修改配置或继续使用

2. **收集配置信息**
   - **方式一**：解析 App Info 格式（推荐）
     ```
     ## App Info
     - App Name: secondme-tinder
     - Client ID: 71658da7-659c-414a-abdf-cb6472037fc2
     - Client Secret: <your-secret>
     - Redirect URIs:
       - http://localhost:3000/api/auth/callback
     - Allowed Scopes: user.info, chat, note.add
     ```
   - **方式二**：手动输入凭证

3. **Scopes 到模块的映射**
   | Scope | 模块 |
   |-------|------|
   | `user.info` | `auth`（必选） |
   | `user.info.shades` | `profile` |
   | `user.info.softmemory` | `profile` |
   | `chat` | `chat` |
   | `note.add` | `note` |

4. **生成配置文件**
   - `.secondme/state.json`：项目状态和配置
   - `CLAUDE.md`：项目说明文档

#### 2.2.3 `secondme-prd` - 产品需求定义

**功能**：通过对话式交互帮助开发者明确产品需求。

**调用方式**：
```
/secondme-prd
```

**对话流程**：

1. **展示 API 能力**
   - 根据已选模块展示相关 API 能力
   - 说明每个模块的功能

2. **收集核心需求**
   - 应用目标：你的应用主要解决什么问题？
   - 目标用户：这个应用是给谁用的？

3. **功能细化**
   - 根据已选模块针对性提问
   - 收集设计偏好
   - 确认需求摘要

#### 2.2.4 `secondme-nextjs` - Next.js 项目生成

**功能**：基于配置和需求生成完整的 Next.js 项目。

**调用方式**：
```
/secondme-nextjs [--quick]
```

**生成内容**：

1. **项目结构**
   ```
   project-name/
   ├── src/
   │   ├── app/
   │   │   ├── api/          # API 路由
   │   │   ├── components/   # React 组件
   │   │   └── ...
   │   └── lib/              # 工具函数
   ├── prisma/
   │   └── schema.prisma     # 数据库模型
   └── .env.local            # 环境变量
   ```

2. **根据模块生成代码**
   - `auth` 模块：OAuth2 认证流程
   - `profile` 模块：用户信息展示
   - `chat` 模块：流式对话功能
   - `note` 模块：笔记添加功能

#### 2.2.5 `secondme-reference` - 技术参考

**功能**：SecondMe API 的完整技术参考文档，供开发时查阅。

**调用方式**：
```
/secondme-reference
```

**包含内容**：
- API 基础 URL
- OAuth2 授权 URL 和流程
- Token 有效期说明
- 权限列表（Scopes）
- API 响应格式与数据路径
- 开发注意事项

### 2.3 使用 Skill 的完整流程

#### 方式一：使用一站式 Skill（推荐）

```bash
# 1. 启动一站式创建流程
/secondme

# 2. 按照提示完成：
#    - 提供 App Info 或手动输入凭证
#    - 选择功能模块
#    - 定义产品需求（或使用 --quick 跳过）
#    - 生成项目代码
```

#### 方式二：分步骤使用

```bash
# 1. 初始化项目配置
/secondme-init

# 2. 定义产品需求（可选）
/secondme-prd

# 3. 生成 Next.js 项目
/secondme-nextjs
```

### 2.4 Skill 生成的文件结构

```
.secondme/
└── state.json          # 项目状态和配置

CLAUDE.md              # 项目说明文档（供 AI 参考）

project-name/           # 生成的项目目录
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── callback/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   └── ...
│   │   ├── components/
│   │   └── page.tsx
│   └── lib/
│       ├── secondme.ts
│       └── prisma.ts
├── prisma/
│   └── schema.prisma
└── .env.local
```

---

## 3. OAuth2 认证流程详解

### 3.1 OAuth2 授权码流程

OAuth2 是 SecondMe API 推荐的第三方应用认证方式，流程如下：

```
用户 → 应用 → SecondMe 授权页 → 回调 → 应用后端 → SecondMe API
```

### 3.2 完整流程步骤

#### 步骤 1：用户点击登录

用户点击"使用 SecondMe 登录"按钮，应用重定向到 SecondMe 授权页面。

**授权 URL**：
```
https://go.second.me/oauth/?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&state={STATE}
```

**参数说明**：
- `client_id`：应用的 Client ID
- `redirect_uri`：回调 URL（必须在应用配置中注册）
- `response_type`：固定为 `code`
- `state`：CSRF 防护参数（随机字符串）

**代码示例**（`src/app/api/auth/login/route.ts`）：

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.SECONDME_CLIENT_ID;
  const redirectUri = process.env.SECONDME_REDIRECT_URI;
  
  // 生成随机 state（CSRF 防护）
  const state = crypto.randomUUID();
  
  // 保存 state 到 session/cookie（用于后续验证）
  // ...
  
  const authUrl = new URL("https://go.second.me/oauth/");
  authUrl.searchParams.append("client_id", clientId!);
  authUrl.searchParams.append("redirect_uri", redirectUri!);
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("state", state);
  
  return NextResponse.redirect(authUrl.toString());
}
```

#### 步骤 2：用户授权

用户在 SecondMe 授权页面登录并授权，SecondMe 重定向回应用的回调 URL。

**回调 URL**：
```
https://your-app.com/api/auth/callback?code={AUTHORIZATION_CODE}&state={STATE}
```

#### 步骤 3：交换授权码为 Token

应用后端使用授权码换取 Access Token 和 Refresh Token。

**API 端点**：`POST /api/oauth/token/code`

**请求格式**：`application/x-www-form-urlencoded`（**重要**：不能使用 JSON）

**请求参数**：
- `grant_type`：`authorization_code`
- `code`：授权码
- `redirect_uri`：必须与授权请求中的一致
- `client_id`：应用 Client ID
- `client_secret`：应用 Client Secret

**代码示例**（`src/app/api/auth/callback/route.ts`）：

```typescript
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.SECONDME_API_BASE_URL ?? "https://app.mindos.com/gate/lab";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  
  // 验证 state（CSRF 防护）
  // ...
  
  // 1. 用授权码换 Token
  const tokenRes = await fetch(`${BASE_URL}/api/oauth/token/code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code!,
      redirect_uri: process.env.SECONDME_REDIRECT_URI!,
      client_id: process.env.SECONDME_CLIENT_ID!,
      client_secret: process.env.SECONDME_CLIENT_SECRET!,
    }),
  });
  
  const tokenJson = await tokenRes.json();
  
  if (tokenJson.code !== 0 || !tokenJson.data) {
    return NextResponse.redirect("/?auth_error=token_failed");
  }
  
  const { accessToken, refreshToken, expiresIn } = tokenJson.data;
  
  // 2. 使用 Access Token 获取用户信息
  const userInfoRes = await fetch(`${BASE_URL}/api/secondme/user/info`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  const userInfoJson = await userInfoRes.json();
  
  if (userInfoJson.code !== 0 || !userInfoJson.data) {
    return NextResponse.redirect("/?auth_error=user_info_failed");
  }
  
  // 3. 保存用户信息和 Token 到数据库
  // ...
  
  // 4. 设置 session cookie
  const response = NextResponse.redirect("/");
  response.cookies.set("session_user_id", userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 天
  });
  
  return response;
}
```

#### 步骤 4：Token 刷新

Access Token 有效期为 2 小时，Refresh Token 有效期为 30 天。当 Access Token 过期时，需要使用 Refresh Token 刷新。

**API 端点**：`POST /api/oauth/token/refresh`

**请求格式**：`application/x-www-form-urlencoded`

**请求参数**：
- `grant_type`：`refresh_token`
- `refresh_token`：Refresh Token
- `client_id`：应用 Client ID
- `client_secret`：应用 Client Secret

**代码示例**（`src/lib/secondme.ts`）：

```typescript
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user) return null;
  
  // 检查 token 是否过期（提前 5 分钟刷新）
  const now = new Date();
  const expiresAt = new Date(user.tokenExpiresAt);
  const shouldRefresh = now >= new Date(expiresAt.getTime() - 5 * 60 * 1000);
  
  if (shouldRefresh) {
    // 刷新 token
    const refreshRes = await fetch(`${BASE_URL}/api/oauth/token/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: user.refreshToken,
        client_id: process.env.SECONDME_CLIENT_ID!,
        client_secret: process.env.SECONDME_CLIENT_SECRET!,
      }),
    });
    
    const refreshJson = await refreshRes.json();
    
    if (refreshJson.code === 0 && refreshJson.data) {
      // 更新数据库中的 token
      await prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: refreshJson.data.accessToken,
          refreshToken: refreshJson.data.refreshToken,
          tokenExpiresAt: new Date(Date.now() + refreshJson.data.expiresIn * 1000),
        },
      });
      
      return refreshJson.data.accessToken;
    }
    
    return null;
  }
  
  return user.accessToken;
}
```

### 3.3 Token 管理最佳实践

1. **存储安全**：
   - Access Token 和 Refresh Token 存储在数据库中
   - 使用 `httpOnly` cookie 存储 session ID
   - 不在客户端暴露 Token

2. **自动刷新**：
   - 在 Token 过期前 5 分钟自动刷新
   - 每次 API 调用前检查 Token 有效性

3. **错误处理**：
   - Refresh Token 过期时，引导用户重新登录
   - 记录 Token 刷新失败的错误日志

---

## 4. 项目架构设计

### 4.1 技术栈

- **框架**：Next.js 14+ (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **数据库 ORM**：Prisma
- **数据库**：PostgreSQL（推荐）或 SQLite（开发）
- **状态管理**：React Hooks
- **API 调用**：原生 `fetch`

### 4.2 目录结构

```
boss-secondme/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证相关
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── callback/route.ts
│   │   │   │   └── logout/route.ts
│   │   │   ├── secondme/      # SecondMe API 代理
│   │   │   │   ├── chat/stream/route.ts
│   │   │   │   └── user/info/route.ts
│   │   │   └── ...
│   │   ├── components/        # React 组件
│   │   │   ├── LoginButton.tsx
│   │   │   ├── UserProfile.tsx
│   │   │   └── ...
│   │   ├── page.tsx           # 首页
│   │   └── layout.tsx         # 根布局
│   └── lib/                   # 工具函数
│       ├── secondme.ts        # SecondMe API 封装
│       ├── prisma.ts          # Prisma Client
│       └── ...
├── prisma/
│   ├── schema.prisma          # 数据库模型
│   └── migrations/            # 数据库迁移
├── .env.local                 # 环境变量
└── package.json
```

### 4.3 数据库设计

#### 4.3.1 User 表（必需）

```prisma
model User {
  id                String   @id @default(cuid())
  secondmeUserId    String   @unique @map("secondme_user_id")
  accessToken       String   @map("access_token")
  refreshToken      String   @map("refresh_token")
  tokenExpiresAt    DateTime @map("token_expires_at")
  avatar            String?  // SecondMe 用户头像
  name              String?  // SecondMe 用户姓名
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  // 关联关系
  candidateProfile  CandidateProfile?
  employerProfile   EmployerProfile?
  matches           Match[]
  
  @@map("users")
}
```

**关键字段说明**：
- `secondmeUserId`：SecondMe 平台的用户 ID（唯一标识）
- `accessToken` / `refreshToken`：OAuth2 Token
- `tokenExpiresAt`：Token 过期时间（用于自动刷新）

#### 4.3.2 业务表设计

根据应用需求设计业务表，例如招聘应用：

```prisma
model CandidateProfile {
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")
  name      String?
  title     String?
  city      String?
  yearsExp  Int?
  skills    String?
  bio       String?
  
  user      User     @relation(fields: [userId], references: [id])
  matches   Match[]
  
  @@map("candidate_profiles")
}

model EmployerProfile {
  id        String   @id @default(cuid())
  userId    String   @unique @map("user_id")
  companyId String   @map("company_id")
  name      String?
  title     String?
  
  user      User     @relation(fields: [userId], references: [id])
  company   Company  @relation(fields: [companyId], references: [id])
  jobs      Job[]
  
  @@map("employer_profiles")
}

model Job {
  id            String   @id @default(cuid())
  employerId    String   @map("employer_id")
  companyId     String   @map("company_id")
  title         String
  description   String
  city          String?
  salaryMin     Int?
  salaryMax     Int?
  tags          String?  // JSON 字符串或逗号分隔
  
  employer      EmployerProfile @relation(fields: [employerId], references: [id])
  company       Company         @relation(fields: [companyId], references: [id])
  matches       Match[]
  
  @@map("jobs")
}
```

### 4.4 API 路由设计

#### 4.4.1 认证路由

- `GET /api/auth/login`：跳转到 SecondMe 授权页
- `GET /api/auth/callback`：处理 OAuth2 回调
- `POST /api/auth/logout`：退出登录

#### 4.4.2 SecondMe API 代理路由

- `GET /api/secondme/user/info`：获取当前用户信息
- `POST /api/secondme/chat/stream`：流式聊天（SSE）
- `GET /api/secondme/user/shades`：获取用户兴趣标签

#### 4.4.3 业务 API 路由

根据应用需求设计，例如：
- `GET /api/jobs`：获取职位列表
- `POST /api/match`：创建匹配
- `GET /api/matches`：获取匹配列表

---

## 5. 核心功能实现

### 5.1 SecondMe API 封装

创建 `src/lib/secondme.ts` 封装所有 SecondMe API 调用：

```typescript
const BASE_URL = process.env.SECONDME_API_BASE_URL ?? "https://app.mindos.com/gate/lab";

/**
 * 获取用户的有效 accessToken，如果过期则自动刷新
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  // 实现 Token 获取和刷新逻辑
  // ...
}

/**
 * 调用 SecondMe Chat API（流式响应）
 */
export async function callSecondMeChatStream(
  accessToken: string,
  message: string,
  sessionId?: string,
  systemPrompt?: string
): Promise<ReadableStream<Uint8Array> | null> {
  const response = await fetch(`${BASE_URL}/api/secondme/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message,
      ...(sessionId && { sessionId }),
      ...(systemPrompt && { systemPrompt }),
    }),
  });
  
  if (!response.ok || !response.body) {
    return null;
  }
  
  return response.body;
}

/**
 * 调用 SecondMe Chat API（流式响应，带回调）
 */
export async function callSecondMeChatStreamWithCallback(
  accessToken: string,
  message: string,
  sessionId?: string,
  systemPrompt?: string,
  onChunk?: (chunk: string) => void
): Promise<{ code: number; data?: any; message?: string }> {
  // 实现流式响应解析和回调
  // ...
}

/**
 * 获取用户信息
 */
export async function getUserInfo(accessToken: string): Promise<ApiResponse<UserInfo>> {
  const response = await fetch(`${BASE_URL}/api/secondme/user/info`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  return await response.json();
}
```

### 5.2 流式对话实现

#### 5.2.1 服务端：SSE 流式响应

创建 `src/app/api/secondme/chat/stream/route.ts`：

```typescript
import { NextRequest } from "next/server";
import { getValidAccessToken, callSecondMeChatStream } from "@/lib/secondme";

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return new Response(JSON.stringify({ code: 401, message: "未登录" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const body = await req.json();
  const { message, sessionId, systemPrompt } = body;
  
  const userId = sessionCookie.value;
  const accessToken = await getValidAccessToken(userId);
  
  if (!accessToken) {
    return new Response(JSON.stringify({ code: 401, message: "无法获取有效的 accessToken" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  // 调用 SecondMe API 并转发流式响应
  const stream = await callSecondMeChatStream(accessToken, message, sessionId, systemPrompt);
  
  if (!stream) {
    return new Response(JSON.stringify({ code: 500, message: "流式响应失败" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

#### 5.2.2 客户端：解析 SSE 流

```typescript
"use client";

export function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSend = async (message: string) => {
    setIsLoading(true);
    
    const response = await fetch("/api/secondme/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    
    if (!response.body) {
      throw new Error("无法获取流式响应");
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let content = "";
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            setIsLoading(false);
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            // 处理 OpenAI 兼容格式: choices[0].delta.content
            if (parsed.choices?.[0]?.delta?.content) {
              content += parsed.choices[0].delta.content;
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content },
              ]);
            }
          } catch (e) {
            console.error("解析消息失败:", e);
          }
        }
      }
    }
  };
  
  // ...
}
```

### 5.3 AI 匹配对话实现

实现两个 SecondMe AI 之间的自动对话：

```typescript
/**
 * 启动两个 SecondMe 用户的自动对话
 */
export async function startAutoConversation(
  candidateToken: string,
  employerToken: string,
  candidateSystemPrompt: string,
  employerSystemPrompt: string,
  maxTurns: number = 5,
  existingHistory: Array<{ turn: number; role: "candidate" | "employer"; content: string }> = [],
  candidateConversationId?: string,
  employerConversationId?: string
): Promise<{
  conversationHistory: Array<{ turn: number; role: "candidate" | "employer"; content: string }>;
  candidateConversationId: string;
  employerConversationId: string | null;
}> {
  const conversationHistory = [...existingHistory];
  let currentCandidateConversationId = candidateConversationId || "";
  let currentEmployerConversationId = employerConversationId || null;
  
  // 第 1 轮：候选人先发言
  if (conversationHistory.length === 0) {
    const initialMessage = "你好，我对这个职位很感兴趣，想了解一下详情。";
    const candidateResult = await callSecondMeChat(
      candidateToken,
      initialMessage,
      currentCandidateConversationId || undefined,
      candidateSystemPrompt
    );
    
    const candidateMessage = candidateResult.data?.response || "";
    currentCandidateConversationId = candidateResult.data?.sessionId || currentCandidateConversationId;
    
    conversationHistory.push({
      turn: 1,
      role: "candidate",
      content: candidateMessage,
    });
  }
  
  // 后续轮次：交替对话
  let currentTurn = Math.max(...conversationHistory.map(m => m.turn), 0);
  
  while (currentTurn < maxTurns) {
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const nextTurn = currentTurn + 1;
    
    if (lastMessage.role === "candidate") {
      // 招聘方回应
      const employerResult = await callSecondMeChat(
        employerToken,
        lastMessage.content,
        currentEmployerConversationId || undefined,
        currentEmployerConversationId ? undefined : employerSystemPrompt
      );
      
      const employerMessage = employerResult.data?.response || "";
      currentEmployerConversationId = employerResult.data?.sessionId || currentEmployerConversationId;
      
      conversationHistory.push({
        turn: nextTurn,
        role: "employer",
        content: employerMessage,
      });
    } else {
      // 候选人回应
      const candidateResult = await callSecondMeChat(
        candidateToken,
        lastMessage.content,
        currentCandidateConversationId || undefined,
        currentCandidateConversationId ? undefined : candidateSystemPrompt
      );
      
      const candidateMessage = candidateResult.data?.response || "";
      currentCandidateConversationId = candidateResult.data?.sessionId || currentCandidateConversationId;
      
      conversationHistory.push({
        turn: nextTurn,
        role: "candidate",
        content: candidateMessage,
      });
    }
    
    currentTurn = nextTurn;
  }
  
  return {
    conversationHistory,
    candidateConversationId: currentCandidateConversationId,
    employerConversationId: currentEmployerConversationId,
  };
}
```

### 5.4 Markdown 渲染

使用 `react-markdown` 渲染对话内容：

```typescript
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
    h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
    p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
    ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
  }}
>
  {message.content}
</ReactMarkdown>
```

---

## 6. 开发流程和范式

### 6.1 使用 Skill 开发的标准流程

#### 阶段 1：项目初始化

```bash
# 1. 使用 Skill 初始化项目
/secondme-init

# 2. 提供 App Info 或手动输入凭证
## App Info
- App Name: my-secondme-app
- Client ID: xxx
- Client Secret: xxx
- Redirect URIs:
  - http://localhost:3000/api/auth/callback
- Allowed Scopes: user.info, chat

# 3. 选择功能模块（根据 Scopes 自动推断）
# 4. 确认数据库连接串
# 5. 生成 .secondme/state.json 和 CLAUDE.md
```

#### 阶段 2：需求定义（可选）

```bash
# 1. 启动 PRD 对话
/secondme-prd

# 2. 回答以下问题：
#    - 应用目标：你的应用主要解决什么问题？
#    - 目标用户：这个应用是给谁用的？
#    - 功能需求：根据已选模块针对性提问
#    - 设计偏好：简约现代 / 活泼有趣 / ...

# 3. 确认需求摘要
```

#### 阶段 3：生成项目

```bash
# 1. 生成 Next.js 项目
/secondme-nextjs

# 2. Skill 会自动：
#    - 创建项目目录结构
#    - 生成 Prisma Schema
#    - 生成 API 路由
#    - 生成前端组件
#    - 生成环境变量配置

# 3. 进入项目目录
cd my-secondme-app

# 4. 安装依赖
npm install

# 5. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入实际值

# 6. 初始化数据库
npx prisma db push

# 7. 启动开发服务器
npm run dev
```

### 6.2 手动开发流程（不使用 Skill）

如果不想使用 Skill，可以按照以下步骤手动开发：

#### 步骤 1：创建 Next.js 项目

```bash
npx create-next-app@latest my-app --typescript --tailwind --app --src-dir --import-alias "@/*"
cd my-app
```

#### 步骤 2：安装依赖

```bash
npm install prisma @prisma/client react-markdown remark-gfm
npm install -D @types/node
```

#### 步骤 3：配置 Prisma

```bash
npx prisma init
```

编辑 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String   @id @default(cuid())
  secondmeUserId    String   @unique @map("secondme_user_id")
  accessToken       String   @map("access_token")
  refreshToken      String   @map("refresh_token")
  tokenExpiresAt    DateTime @map("token_expires_at")
  avatar            String?
  name              String?
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  @@map("users")
}
```

#### 步骤 4：配置环境变量

创建 `.env.local`：

```env
# SecondMe OAuth2 配置
SECONDME_CLIENT_ID=your_client_id
SECONDME_CLIENT_SECRET=your_client_secret
SECONDME_REDIRECT_URI=http://localhost:3000/api/auth/callback

# SecondMe API
SECONDME_API_BASE_URL=https://app.mindos.com/gate/lab

# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
```

#### 步骤 5：实现认证流程

参考 [3. OAuth2 认证流程详解](#3-oauth2-认证流程详解) 实现：
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/callback/route.ts`
- `src/lib/secondme.ts`

#### 步骤 6：实现业务功能

根据应用需求实现：
- API 路由
- 前端组件
- 数据库模型

### 6.3 开发范式总结

#### 6.3.1 API 调用范式

**统一使用封装函数**：

```typescript
// ✅ 正确：使用封装函数
const accessToken = await getValidAccessToken(userId);
const userInfo = await getUserInfo(accessToken);

// ❌ 错误：直接调用 API
const response = await fetch(`${BASE_URL}/api/secondme/user/info`, {
  headers: { Authorization: `Bearer ${user.accessToken}` },
});
```

**统一错误处理**：

```typescript
const result = await getUserInfo(accessToken);

if (result.code !== 0) {
  console.error("获取用户信息失败:", result.message);
  return null;
}

return result.data;
```

#### 6.3.2 Token 管理范式

**自动刷新 Token**：

```typescript
// 每次 API 调用前获取有效 Token
const accessToken = await getValidAccessToken(userId);
if (!accessToken) {
  // Token 刷新失败，引导用户重新登录
  redirect("/api/auth/login");
}
```

**提前刷新**：

```typescript
// 在 Token 过期前 5 分钟刷新
const shouldRefresh = now >= new Date(expiresAt.getTime() - 5 * 60 * 1000);
```

#### 6.3.3 流式响应处理范式

**服务端转发**：

```typescript
// 直接转发 SecondMe API 的流式响应
const stream = await callSecondMeChatStream(accessToken, message);
return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  },
});
```

**客户端解析**：

```typescript
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      const data = line.slice(6).trim();
      if (data === "[DONE]") break;
      // 处理数据
    }
  }
}
```

---

## 7. 最佳实践

### 7.1 安全性

1. **Token 存储**：
   - ✅ 存储在数据库中，使用 `httpOnly` cookie
   - ❌ 不要存储在 localStorage 或暴露给客户端

2. **环境变量**：
   - ✅ 使用 `.env.local` 存储敏感信息
   - ✅ 在生产环境使用环境变量管理服务
   - ❌ 不要提交 `.env.local` 到版本控制

3. **CSRF 防护**：
   - ✅ 使用 `state` 参数验证 OAuth2 回调
   - ✅ 使用随机字符串生成 `state`

### 7.2 性能优化

1. **Token 缓存**：
   - 在内存中缓存有效的 Access Token
   - 避免频繁查询数据库

2. **流式响应**：
   - 使用 SSE 实现实时对话
   - 避免等待完整响应后再返回

3. **数据库查询**：
   - 使用 Prisma 的 `include` 和 `select` 优化查询
   - 避免 N+1 查询问题

### 7.3 错误处理

1. **统一错误格式**：

```typescript
interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
}

// 成功：code === 0
// 错误：code !== 0
```

2. **错误分类处理**：

```typescript
if (result.code === 401) {
  // Token 过期，刷新或重新登录
} else if (result.code === 403) {
  // 权限不足
} else if (result.code >= 500) {
  // 服务器错误，重试
}
```

3. **用户友好的错误提示**：

```typescript
const errorMessages: Record<number, string> = {
  401: "登录已过期，请重新登录",
  403: "权限不足",
  404: "资源不存在",
  500: "服务器错误，请稍后重试",
};

const message = errorMessages[result.code] || result.message || "未知错误";
```

### 7.4 代码组织

1. **模块化设计**：
   - `lib/secondme.ts`：SecondMe API 封装
   - `lib/prisma.ts`：Prisma Client
   - `lib/ai-match.ts`：AI 匹配逻辑

2. **类型定义**：

```typescript
// 统一类型定义
interface UserInfo {
  userId: string;
  name: string;
  avatar?: string;
}

interface ApiResponse<T> {
  code: number;
  message?: string;
  data?: T;
}
```

3. **组件复用**：

```typescript
// 可复用的组件
<UserAvatar user={user} />
<LoginButton />
<ChatWindow sessionId={sessionId} />
```

---

## 8. 常见问题与解决方案

### 8.1 OAuth2 相关问题

#### 问题 1：`redirect_uri` 不匹配

**错误信息**：
```
oauth2.redirect_uri.mismatch
```

**原因**：回调 URL 与注册的 Redirect URI 不一致。

**解决方案**：
1. 检查 `.env.local` 中的 `SECONDME_REDIRECT_URI`
2. 确保与 SecondMe 应用配置中的 Redirect URI 完全一致
3. 注意协议（http/https）和端口号

#### 问题 2：Token 刷新失败

**错误信息**：
```
oauth2.refresh_token.expired
```

**原因**：Refresh Token 已过期（30 天）。

**解决方案**：
1. 检测到 Refresh Token 过期时，清除用户 session
2. 引导用户重新登录

```typescript
if (refreshJson.code !== 0 && refreshJson.subCode === "oauth2.refresh_token.expired") {
  // 清除 session
  await prisma.user.update({
    where: { id: userId },
    data: { accessToken: "", refreshToken: "" },
  });
  // 引导重新登录
  redirect("/api/auth/login");
}
```

### 8.2 API 调用问题

#### 问题 1：流式响应解析失败

**错误信息**：
```
解析消息失败: Unexpected token
```

**原因**：SSE 数据可能跨 chunk 分割。

**解决方案**：
使用 buffer 累积数据，完整解析后再处理：

```typescript
let buffer = "";
const lines = buffer.split("\n");
buffer = lines.pop() || ""; // 保留不完整的行

for (const line of lines) {
  if (line.startsWith("data: ")) {
    try {
      const parsed = JSON.parse(line.slice(6));
      // 处理数据
    } catch (e) {
      // 忽略解析错误（可能是跨 chunk 分割）
    }
  }
}
```

#### 问题 2：API 响应格式不一致

**错误信息**：
```
Cannot read property 'data' of undefined
```

**原因**：不同 API 端点的响应格式可能略有不同。

**解决方案**：
统一处理响应格式：

```typescript
const result = await response.json();

// 检查业务状态码
if (result.code !== 0) {
  throw new Error(result.message || "API 调用失败");
}

// 安全访问 data
const data = result.data || {};
```

### 8.3 数据库问题

#### 问题 1：Prisma Client 未更新

**错误信息**：
```
Unknown field 'avatar' for select statement on model 'User'
```

**原因**：Schema 更新后未重新生成 Prisma Client。

**解决方案**：
```bash
npx prisma generate
# 或
npx prisma db push
```

#### 问题 2：迁移冲突

**错误信息**：
```
Migration conflict
```

**原因**：多人协作时迁移文件冲突。

**解决方案**：
1. 重置开发数据库：`npx prisma migrate reset`
2. 重新生成迁移：`npx prisma migrate dev`
3. 或手动解决冲突后：`npx prisma migrate resolve --applied <migration_name>`

### 8.4 前端问题

#### 问题 1：Markdown 渲染样式问题

**解决方案**：
使用 `prose` 类或自定义样式：

```typescript
<div className="prose prose-sm max-w-none">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {content}
  </ReactMarkdown>
</div>
```

#### 问题 2：流式响应 UI 卡顿

**原因**：频繁更新状态导致重渲染。

**解决方案**：
使用 `useCallback` 和 `useMemo` 优化：

```typescript
const updateMessage = useCallback((chunk: string) => {
  setMessages((prev) => {
    const last = prev[prev.length - 1];
    if (last && last.role === "assistant") {
      return [...prev.slice(0, -1), { ...last, content: last.content + chunk }];
    }
    return prev;
  });
}, []);
```

---

## 9. 参考资源

### 9.1 官方文档

- [SecondMe API 文档](https://develop-docs.second.me/zh/docs)
- [OAuth2 认证指南](https://develop-docs.second.me/zh/docs/authentication/oauth2)
- [API 参考](https://develop-docs.second.me/zh/docs/api-reference/secondme)
- [错误码参考](https://develop-docs.second.me/zh/docs/errors)

### 9.2 参考项目

- `reference demo/2026-01-29-secondme-demo1`：网络匹配应用示例
- `reference demo/secondme-demo2`：漫画生成应用示例

### 9.3 Skill 文档

- `Second-Me-Skills/skills/secondme/SKILL.md`：一站式项目创建
- `Second-Me-Skills/skills/secondme-init/SKILL.md`：项目初始化
- `Second-Me-Skills/skills/secondme-prd/SKILL.md`：需求定义
- `Second-Me-Skills/skills/secondme-nextjs/SKILL.md`：项目生成

---

## 10. 总结

### 10.1 开发流程总结

1. **使用 Skill 快速启动**（推荐）：
   ```
   /secondme → 初始化 → 定义需求 → 生成项目
   ```

2. **手动开发**（高级）：
   ```
   创建项目 → 配置 Prisma → 实现认证 → 实现业务功能
   ```

### 10.2 核心要点

1. **OAuth2 认证**：
   - 使用授权码流程
   - 自动刷新 Token
   - 安全存储凭证

2. **API 调用**：
   - 统一封装函数
   - 统一错误处理
   - 流式响应处理

3. **数据库设计**：
   - User 表必须包含 Token 字段
   - 使用 Prisma ORM
   - 合理设计关联关系

4. **前端开发**：
   - 使用 Next.js App Router
   - 服务端组件 + 客户端组件
   - Markdown 渲染对话内容

### 10.3 下一步

- 阅读 [SecondMe API 文档](https://develop-docs.second.me/zh/docs)
- 查看参考项目代码
- 使用 Skill 创建自己的项目
- 加入 SecondMe 开发者社区

---

**文档版本**：1.0.0  
**最后更新**：2025-02-06  
**作者**：SecondMe 开发团队
