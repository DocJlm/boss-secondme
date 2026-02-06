import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/me
 *
 * 从 session_user_id cookie 中读取当前登录用户，并返回基本信息。
 */
export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");

  if (!sessionCookie?.value) {
    return NextResponse.json(
      { code: 401, message: "未登录" },
      { status: 401 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionCookie.value },
  });

  if (!user) {
    return NextResponse.json(
      { code: 401, message: "用户不存在或已被删除" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    code: 0,
    data: {
      id: user.id,
      secondmeUserId: user.secondmeUserId,
    },
  });
}

