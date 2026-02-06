import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * 清除 session cookie，实现退出登录。
 */
export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ success: true });

  res.cookies.set("session_user_id", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return res;
}

