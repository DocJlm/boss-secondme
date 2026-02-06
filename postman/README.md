# Postman Collection 使用指南

## 📥 导入步骤

1. 打开 Postman
2. 点击左上角 **Import** 按钮
3. 选择文件 `SecondMe-Boss-Demo.postman_collection.json`
4. 导入成功后，左侧会看到 **"SecondMe Boss 直聘 Demo"** 这个 Collection

## 🔑 设置 Cookie（重要）

由于 OAuth2 登录流程在浏览器中完成，Postman 需要复用浏览器登录后的 Cookie。

### 方法一：在每个请求中手动设置（推荐用于测试）

1. 在浏览器中登录：
   - 访问 `http://localhost:3000`
   - 点击「使用 SecondMe 登录」
   - 完成授权后回到首页

2. 获取 Cookie 值：
   - 按 `F12` 打开开发者工具
   - 切换到 **Application**（或 **存储**）标签
   - 左侧展开 **Cookies** → `http://localhost:3000`
   - 找到 `session_user_id`，复制它的 **Value**

3. 在 Postman 中设置：
   - 打开任意一个需要登录的请求
   - 切换到 **Headers** 标签
   - 添加一行：
     - Key: `Cookie`
     - Value: `session_user_id=你复制的值`

### 方法二：在 Collection 级别统一设置（推荐用于批量测试）

1. 右键点击 Collection **"SecondMe Boss 直聘 Demo"**
2. 选择 **Edit**
3. 切换到 **Variables** 标签
4. 找到 `sessionCookie` 变量，在 **Current Value** 中填入：`session_user_id=你的值`
5. 保存后，Collection 中所有请求的 `{{sessionCookie}}` 变量会自动替换

## 📋 测试流程建议

### 第一步：验证登录状态
- 运行 **认证相关 → 检查登录状态**
- 如果返回 `code: 0` 且有 `data.id`，说明登录成功
- 如果返回 401，说明 Cookie 没设置对

### 第二步：初始化角色
选择一个角色初始化：

**选项 A：招聘方**
- 运行 **角色初始化 → 初始化为招聘方 (Employer)**
- 成功后可以创建职位

**选项 B：候选人**
- 运行 **角色初始化 → 初始化为候选人 (Candidate)**
- 成功后可以浏览职位和点赞

> 💡 提示：如果你想同时测试两个角色，可以用两个不同的 SecondMe 账号分别登录

### 第三步：创建职位（仅招聘方）
- 运行 **职位管理 → 创建职位 (招聘方)**
- 可以多创建几个职位用于测试
- 创建成功后，记录返回的 `data.id`（这是 `jobId`，后续匹配时会用到）

### 第四步：浏览职位（候选人）
- 运行 **职位管理 → 获取所有开放职位**
- 查看返回的职位列表
- 从列表中复制一个 `id` 作为 `jobId`

### 第五步：匹配操作（候选人）
- 运行 **匹配操作 → 点赞职位 (Like)**，将 `jobId` 替换为实际的职位 ID
- 再运行 **匹配操作 → 略过职位 (Pass)**，测试略过功能

## 🌐 环境变量

Collection 中预定义了以下变量：

- `baseUrl`: 默认 `http://localhost:3000`
  - 如果后端运行在其他端口，可以修改这个值
  - 修改方法：右键 Collection → Edit → Variables

- `sessionCookie`: Cookie 值（需要手动设置）
  - 格式：`session_user_id=clxxx...`

## 🔍 常见问题

### Q: 为什么所有请求都返回 401？
A: Cookie 没有正确设置。请按照上面的「设置 Cookie」步骤重新操作。

### Q: 创建职位时返回 403？
A: 当前账号还没有初始化为招聘方角色。先运行「初始化为招聘方」请求。

### Q: 点赞职位时返回 404？
A: `jobId` 可能不存在或已关闭。先用「获取所有开放职位」确认职位 ID。

### Q: Cookie 过期了怎么办？
A: 重新在浏览器中登录一次，然后更新 Postman 中的 Cookie 值。

## 📝 下一步

完成这些 API 测试后，你可以：
1. 在浏览器中访问 `http://localhost:3000/jobs` 查看职位列表页面
2. 访问 `http://localhost:3000/employer/jobs` 查看招聘方管理页面
3. 继续开发前端页面，集成这些 API
