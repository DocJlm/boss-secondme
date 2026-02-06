import { NextRequest } from "next/server";
import { getValidAccessToken, callSecondMeChatStream } from "@/lib/secondme";
import type { ApiResponse } from "@/lib/types";

/**
 * POST /api/secondme/chat/stream
 * 封装 SecondMe Chat API（流式响应）
 * 根据 SecondMe API 文档，直接转发到 SecondMe 的流式端点
 */
export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    const errorResponse: ApiResponse = { code: 401, message: "未登录" };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const { message, conversationId, system } = body as {
    message?: string;
    conversationId?: string;
    system?: string;
  };

  if (!message) {
    const errorResponse: ApiResponse = { code: 400, message: "message 为必填" };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = sessionCookie.value;
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    const errorResponse: ApiResponse = { code: 401, message: "无法获取有效的 accessToken" };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // 使用封装函数调用 SecondMe 的流式端点
    const stream = await callSecondMeChatStream(
      accessToken,
      message,
      conversationId,
      system
    );

    if (!stream) {
      const errorResponse: ApiResponse = { code: 500, message: "流式响应失败" };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 直接转发流式响应
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("SecondMe Chat Stream API error:", error);
    const errorResponse: ApiResponse = {
      code: 500,
      message: error.message || "流式响应失败",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
