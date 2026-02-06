import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken, callSecondMeChat } from "@/lib/secondme";

/**
 * POST /api/secondme/chat
 * 封装 SecondMe Chat API
 */
export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { message, conversationId } = body as {
    message?: string;
    conversationId?: string;
  };

  if (!message) {
    return NextResponse.json(
      { code: 400, message: "message 为必填" },
      { status: 400 }
    );
  }

  const userId = sessionCookie.value;
  const accessToken = await getValidAccessToken(userId);

  if (!accessToken) {
    return NextResponse.json(
      { code: 401, message: "无法获取有效的 accessToken" },
      { status: 401 }
    );
  }

  const result = await callSecondMeChat(accessToken, message, conversationId);

  if (result.code !== 0) {
    return NextResponse.json(
      {
        code: result.code,
        message: result.message || "调用 SecondMe Chat API 失败",
      },
      { status: result.code >= 400 && result.code < 600 ? result.code : 500 }
    );
  }

  return NextResponse.json({ code: 0, data: result.data });
}
