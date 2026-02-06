import { prisma } from "@/lib/prisma";
import { secondmeConfig, getApiUrl, validateOAuthConfig } from "@/lib/config";
import type { ApiResponse, UserInfo, TokenResponse } from "@/lib/types";

/**
 * 获取用户的有效 accessToken，如果过期则自动刷新
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  // 检查 token 是否过期（提前 5 分钟刷新）
  const now = new Date();
  const expiresAt = new Date(user.tokenExpiresAt);
  const shouldRefresh = now >= new Date(expiresAt.getTime() - 5 * 60 * 1000);

  if (shouldRefresh) {
    // 刷新 token
    const clientId = process.env.SECONDME_CLIENT_ID;
    const clientSecret = process.env.SECONDME_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing OAuth env config for token refresh");
      return null;
    }

    // 验证 OAuth 配置
    const configCheck = validateOAuthConfig();
    if (!configCheck.valid) {
      console.error("Missing OAuth env config:", configCheck.missing.join(", "));
      return null;
    }

    try {
      const refreshRes = await fetch(getApiUrl(secondmeConfig.refreshTokenEndpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: user.refreshToken,
          client_id: secondmeConfig.oauth.clientId!,
          client_secret: secondmeConfig.oauth.clientSecret!,
        }),
      });

      if (!refreshRes.ok) {
        console.error("Token refresh HTTP error:", refreshRes.status);
        return null;
      }

      const refreshJson = (await refreshRes.json()) as ApiResponse<TokenResponse>;
      if (refreshJson.code !== 0 || !refreshJson.data) {
        console.error("Token refresh business error:", refreshJson);
        return null;
      }

      const { accessToken, refreshToken, expiresIn } = refreshJson.data;
      const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

      // 更新数据库
      await prisma.user.update({
        where: { id: userId },
        data: {
          accessToken,
          refreshToken,
          tokenExpiresAt,
        },
      });

      return accessToken;
    } catch (error) {
      console.error("Token refresh error:", error);
      return null;
    }
  }

  return user.accessToken;
}

/**
 * 获取 SecondMe 用户信息（包括头像、姓名等）
 * @param accessToken 用户的 accessToken
 */
export async function getUserInfo(accessToken: string): Promise<ApiResponse<UserInfo>> {
  try {
    const response = await fetch(getApiUrl(secondmeConfig.endpoints.userInfo), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "无法读取错误信息");
      console.error(`SecondMe User Info API HTTP error ${response.status}:`, errorText);
      return {
        code: response.status,
        message: `HTTP error: ${response.status} - ${errorText.substring(0, 200)}`,
      };
    }

    const result = (await response.json()) as ApiResponse<UserInfo>;
    
    if (result.code !== 0) {
      console.error("SecondMe User Info API 业务错误:", result);
    }
    
    return result;
  } catch (error: any) {
    console.error("SecondMe User Info API 异常:", error);
    return {
      code: 500,
      message: error.message || "调用 SecondMe User Info API 失败",
    };
  }
}

/**
 * 调用 SecondMe Chat API（非流式，读取完整响应）
 * 根据 SDK 文档和参考示例，Chat API 只有流式端点，这里通过读取流来获取完整响应
 * @param accessToken 用户的 accessToken
 * @param message 用户消息
 * @param sessionId 可选的会话 ID（注意：使用 sessionId 而不是 conversationId）
 * @param systemPrompt 可选的系统提示词（场景设置）
 */
export async function callSecondMeChat(
  accessToken: string,
  message: string,
  sessionId?: string,
  systemPrompt?: string
): Promise<ApiResponse<{ response: string; message: string; content: string; conversationId: string; sessionId: string }>> {
  try {
    // 根据 SDK 文档，Chat API 端点是 /api/secondme/chat/stream
    const requestBody: any = {
      message,
      ...(sessionId && { sessionId }),
      ...(systemPrompt && { systemPrompt }),
    };

    const response = await fetch(getApiUrl(secondmeConfig.endpoints.chatStream), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "无法读取错误信息");
      console.error(`SecondMe Chat API HTTP error ${response.status}:`, errorText);
      return {
        code: response.status,
        message: `HTTP error: ${response.status} - ${errorText.substring(0, 200)}`,
      };
    }

    // 读取流式响应
    const reader = response.body?.getReader();
    if (!reader) {
      return {
        code: 500,
        message: "响应体为空",
      };
    }

    const decoder = new TextDecoder();
    let content = "";
    let newSessionId = sessionId || "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 处理 session 事件
        if (line === "event: session") {
          const nextLine = lines[++i]?.trim();
          if (nextLine && nextLine.startsWith("data: ")) {
            try {
              const sessionData = JSON.parse(nextLine.slice(6));
              if (sessionData.sessionId) {
                newSessionId = sessionData.sessionId;
              }
            } catch {
              // 解析失败，忽略
            }
          }
          continue;
        }

        // 处理 data 行
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            // 处理 OpenAI 兼容格式: choices[0].delta.content
            if (parsed.choices?.[0]?.delta?.content) {
              content += parsed.choices[0].delta.content;
            }
            // 处理其他可能的格式
            else if (parsed.content) {
              content += parsed.content;
            }
            else if (parsed.delta) {
              content += parsed.delta;
            }
          } catch {
            // JSON 解析失败，忽略（可能是跨 chunk 分割的数据）
          }
        }
      }
    }

    // 处理剩余的 buffer
    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              content += parsed.choices[0].delta.content;
            } else if (parsed.content) {
              content += parsed.content;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    return {
      code: 0,
      data: {
        response: content,
        message: content,
        content: content,
        conversationId: newSessionId,
        sessionId: newSessionId,
      },
    };
  } catch (error: any) {
    console.error("SecondMe Chat API 异常:", error);
    return {
      code: 500,
      message: error.message || "调用 SecondMe Chat API 失败",
    };
  }
}

/**
 * 调用 SecondMe Chat API（流式响应）
 * 根据 SecondMe API 文档，流式响应使用 /api/secondme/chat/stream 端点
 * 返回 ReadableStream
 */
export async function callSecondMeChatStream(
  accessToken: string,
  message: string,
  conversationId?: string,
  systemPrompt?: string
): Promise<ReadableStream<Uint8Array> | null> {
  try {
    // 根据 SecondMe API 文档，流式响应使用 /api/secondme/chat/stream 端点
    const requestBody: any = {
      message,
      ...(conversationId && { sessionId: conversationId }),
      ...(systemPrompt && { systemPrompt }),
    };

    const response = await fetch(getApiUrl(secondmeConfig.endpoints.chatStream), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "无法读取错误信息");
      console.error(`SecondMe Chat Stream API HTTP error ${response.status}:`, errorText);
      return null;
    }

    if (!response.body) {
      console.error("Response body is null");
      return null;
    }

    return response.body;
  } catch (error: any) {
    console.error("SecondMe Chat Stream API error:", error);
    return null;
  }
}

/**
 * 调用 SecondMe Chat API（流式响应，带回调）
 * 实时调用 onChunk 回调处理流式内容
 */
export async function callSecondMeChatStreamWithCallback(
  accessToken: string,
  message: string,
  conversationId?: string,
  systemPrompt?: string,
  onChunk?: (chunk: string) => void
): Promise<ApiResponse<{ response: string; message: string; content: string; conversationId: string; sessionId: string }>> {
  try {
    const requestBody: any = {
      message,
      ...(conversationId && { sessionId: conversationId }),
      ...(systemPrompt && { systemPrompt }),
    };

    const response = await fetch(getApiUrl(secondmeConfig.endpoints.chatStream), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "无法读取错误信息");
      console.error(`SecondMe Chat Stream API HTTP error ${response.status}:`, errorText);
      return {
        code: response.status,
        message: `HTTP error: ${response.status} - ${errorText.substring(0, 200)}`,
      };
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return {
        code: 500,
        message: "响应体为空",
      };
    }

    const decoder = new TextDecoder();
    let content = "";
    let newSessionId = conversationId || "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 处理 session 事件
        if (line === "event: session") {
          const nextLine = lines[++i]?.trim();
          if (nextLine && nextLine.startsWith("data: ")) {
            try {
              const sessionData = JSON.parse(nextLine.slice(6));
              if (sessionData.sessionId) {
                newSessionId = sessionData.sessionId;
              }
            } catch {
              // 解析失败，忽略
            }
          }
          continue;
        }

        // 处理 data 行
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            let chunk = "";
            // 处理 OpenAI 兼容格式: choices[0].delta.content
            if (parsed.choices?.[0]?.delta?.content) {
              chunk = parsed.choices[0].delta.content;
              content += chunk;
            }
            // 处理其他可能的格式
            else if (parsed.content) {
              chunk = parsed.content;
              content += chunk;
            } else if (parsed.delta) {
              chunk = parsed.delta;
              content += chunk;
            }
            
            // 实时调用回调
            if (chunk && onChunk) {
              onChunk(chunk);
            }
          } catch {
            // JSON 解析失败，忽略（可能是跨 chunk 分割的数据）
          }
        }
      }
    }

    // 处理剩余的 buffer
    if (buffer.trim()) {
      const line = buffer.trim();
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data);
            let chunk = "";
            if (parsed.choices?.[0]?.delta?.content) {
              chunk = parsed.choices[0].delta.content;
              content += chunk;
            } else if (parsed.content) {
              chunk = parsed.content;
              content += chunk;
            }
            
            if (chunk && onChunk) {
              onChunk(chunk);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    return {
      code: 0,
      data: {
        response: content,
        message: content,
        content: content,
        conversationId: newSessionId,
        sessionId: newSessionId,
      },
    };
  } catch (error: any) {
    console.error("SecondMe Chat Stream API 异常:", error);
    return {
      code: 500,
      message: error.message || "调用 SecondMe Chat API 失败",
    };
  }
}
