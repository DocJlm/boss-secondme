/**
 * SecondMe API 配置管理
 * 
 * 根据 Second-Me-Skills 最佳实践，统一管理所有 API 端点和配置
 * 避免硬编码，便于维护和更新
 */

/**
 * SecondMe API 配置
 * 所有 API 端点均从此配置读取，不硬编码
 */
export const secondmeConfig = {
  /**
   * API 基础 URL
   */
  apiBaseUrl: process.env.SECONDME_API_BASE_URL ?? "https://app.mindos.com/gate/lab",
  
  /**
   * OAuth2 授权 URL
   */
  oauthUrl: process.env.SECONDME_OAUTH_URL ?? "https://go.second.me/oauth/",
  
  /**
   * Token 端点
   */
  tokenEndpoint: "/api/oauth/token/code",
  refreshTokenEndpoint: "/api/oauth/token/refresh",
  
  /**
   * SecondMe API 端点
   */
  endpoints: {
    userInfo: "/api/secondme/user/info",
    userShades: "/api/secondme/user/shades",
    userSoftMemory: "/api/secondme/user/softmemory",
    chatStream: "/api/secondme/chat/stream",
    chatSessionList: "/api/secondme/chat/session/list",
    chatSessionMessages: "/api/secondme/chat/session/messages",
    noteAdd: "/api/secondme/note/add",
    ttsGenerate: "/api/secondme/tts/generate",
  },
  
  /**
   * Token 有效期（秒）
   */
  tokenTTL: {
    accessToken: 7200, // 2 小时
    refreshToken: 2592000, // 30 天
    authorizationCode: 300, // 5 分钟
  },
  
  /**
   * OAuth2 配置
   */
  oauth: {
    clientId: process.env.SECONDME_CLIENT_ID,
    clientSecret: process.env.SECONDME_CLIENT_SECRET,
    redirectUri: process.env.SECONDME_REDIRECT_URI,
    scopes: [
      "user.info",
      "user.info.shades",
      "user.info.softmemory",
      "chat",
      "note.add",
    ],
  },
} as const;

/**
 * 获取完整的 API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${secondmeConfig.apiBaseUrl}${endpoint}`;
}

/**
 * 验证 OAuth 配置是否完整
 */
export function validateOAuthConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  if (!secondmeConfig.oauth.clientId) {
    missing.push("SECONDME_CLIENT_ID");
  }
  if (!secondmeConfig.oauth.clientSecret) {
    missing.push("SECONDME_CLIENT_SECRET");
  }
  if (!secondmeConfig.oauth.redirectUri) {
    missing.push("SECONDME_REDIRECT_URI");
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}
