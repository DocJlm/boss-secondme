/**
 * SecondMe API 统一类型定义
 * 
 * 根据 Second-Me-Skills 最佳实践，统一管理所有 API 响应类型
 */

/**
 * SecondMe API 统一响应格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
  subCode?: string;
}

/**
 * OAuth2 Token 响应
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope: string[];
}

/**
 * 用户信息
 */
export interface UserInfo {
  userId?: string;
  id?: string;
  openId?: string;
  name?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  selfIntroduction?: string;
  profileCompleteness?: number;
  route?: string;
}

/**
 * 用户兴趣标签（Shade）
 */
export interface UserShade {
  id: number;
  shadeName: string;
  shadeIcon: string;
  confidenceLevel: string;
  shadeDescription: string;
  shadeDescriptionThirdView: string;
  shadeContent: string;
  shadeContentThirdView: string;
  sourceTopics: string[];
  shadeNamePublic?: string;
  shadeIconPublic?: string;
  confidenceLevelPublic?: string;
  shadeDescriptionPublic?: string;
  shadeDescriptionThirdViewPublic?: string;
  shadeContentPublic?: string;
  shadeContentThirdViewPublic?: string;
  sourceTopicsPublic?: string[];
  hasPublicContent: boolean;
}

/**
 * 软记忆
 */
export interface SoftMemory {
  id: number;
  factObject: string;
  factContent: string;
  createTime: number;
  updateTime: number;
}

/**
 * 软记忆列表响应
 */
export interface SoftMemoryListResponse {
  list: SoftMemory[];
  total: number;
}

/**
 * 聊天会话
 */
export interface ChatSession {
  sessionId: string;
  appId: string;
  lastMessage: string;
  lastUpdateTime: string;
  messageCount: number;
}

/**
 * 聊天消息
 */
export interface ChatMessage {
  messageId: string;
  role: "system" | "user" | "assistant";
  content: string;
  senderUserId: number;
  receiverUserId: number | null;
  createTime: string;
}

/**
 * 笔记添加响应
 */
export interface NoteAddResponse {
  noteId: number;
}

/**
 * TTS 生成响应
 */
export interface TTSResponse {
  url: string;
  durationMs: number;
  sampleRate: number;
  format: string;
}

/**
 * 流式聊天响应数据格式
 */
export interface ChatStreamDelta {
  content?: string;
}

export interface ChatStreamChoice {
  delta: ChatStreamDelta;
}

export interface ChatStreamData {
  choices?: ChatStreamChoice[];
  content?: string;
  delta?: string;
}

/**
 * Session 事件数据
 */
export interface SessionEventData {
  sessionId: string;
}
