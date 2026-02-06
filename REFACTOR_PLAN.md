# SecondMe API 调用修复和前端风格重构计划

## 问题分析

1. **API 端点错误**：当前代码使用 `/api/secondme/chat`，但根据 SDK 文档和参考示例，正确的端点是 `/api/secondme/chat/stream`（流式）
2. **参数使用错误**：使用了 `conversationId` 而不是 `sessionId`，`systemPrompt` 的使用方式不正确
3. **前端风格不一致**：当前 UI 不符合 SecondMe 的橙色主题风格

## 已完成的修复

### 1. API 调用修复 (`boss-secondme/src/lib/secondme.ts`)
- ✅ 将 `callSecondMeChat` 改为使用 `/api/secondme/chat/stream` 端点
- ✅ 实现流式响应读取，获取完整内容
- ✅ 支持 `systemPrompt` 参数（在请求体中）
- ✅ 使用 `sessionId` 而不是 `conversationId`
- ✅ 正确处理 SSE 格式的响应（`event: session`, `data: {...}`, `[DONE]`）

### 2. AI 匹配逻辑修复 (`boss-secondme/src/lib/ai-match.ts`)
- ✅ 更新 `startAutoConversation` 使用正确的 API 调用方式
- ✅ 修复 `sessionId` 的获取和使用
- ✅ 修复 `systemPrompt` 的传递（只在首次调用时传递）

## 待完成的任务

### 3. 前端风格重构

#### 3.1 全局样式更新 (`boss-secondme/src/app/globals.css`)
- [ ] 参考 `reference demo/2026-01-29-secondme-demo1/src/app/globals.css` 和 `reference demo/secondme-demo2/src/app/globals.css`
- [ ] 更新颜色主题为 SecondMe 橙色风格（`#FF6B35` 或类似橙色）
- [ ] 更新按钮、卡片、输入框等组件的样式
- [ ] 添加圆角、阴影等视觉效果

#### 3.2 广场页面样式 (`boss-secondme/src/app/plaza/`)
- [ ] 更新 `PlazaClient.tsx` 的布局和样式
- [ ] 更新 `EmployerCard.tsx` 的卡片设计，参考参考示例的卡片样式
- [ ] 更新 `CandidateCard.tsx` 的卡片设计
- [ ] 添加匹配度显示的美化样式

#### 3.3 匹配对话页面 (`boss-secondme/src/app/match/[userId]/`)
- [ ] 更新 `MatchChatClient.tsx` 的聊天界面样式
- [ ] 参考 `reference demo/secondme-demo2/src/components/comic/ChatInterface.tsx` 的聊天界面设计
- [ ] 添加消息气泡样式（用户消息和 AI 消息）
- [ ] 添加流式消息显示效果

#### 3.4 其他页面样式
- [ ] 更新首页 (`boss-secondme/src/app/page.tsx`) 的样式
- [ ] 更新角色选择页面 (`boss-secondme/src/app/select-role/`) 的样式
- [ ] 更新雇主页面 (`boss-secondme/src/app/employer/`) 的样式

### 4. 代码优化

#### 4.1 API 路由优化
- [ ] 检查并更新所有使用 SecondMe API 的路由
- [ ] 确保所有 API 调用都使用正确的端点和参数格式

#### 4.2 错误处理改进
- [ ] 改进 API 调用的错误处理
- [ ] 添加更友好的错误提示

## 实施步骤

1. **第一步**：完成全局样式更新，建立 SecondMe 橙色主题
2. **第二步**：更新广场页面的卡片和布局样式
3. **第三步**：更新匹配对话页面的聊天界面样式
4. **第四步**：更新其他页面的样式以保持一致性
5. **第五步**：测试所有功能，确保 API 调用正常

## 参考资源

- SDK 文档：`doc/secondmeSDK.md`
- 参考示例 1：`reference demo/2026-01-29-secondme-demo1/`
- 参考示例 2：`reference demo/secondme-demo2/`
- 官方文档：`https://develop-docs.second.me/en/docs`

## 注意事项

1. 保持代码的可维护性和可读性
2. 确保所有 API 调用都遵循 SDK 文档的规范
3. 保持 UI 风格的一致性
4. 确保响应式设计，适配不同屏幕尺寸
