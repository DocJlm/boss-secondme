import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/match/status?jobId=xxx
 * 获取当前用户对某个职位的匹配状态
 */
export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json(
      { code: 400, message: "jobId 为必填" },
      { status: 400 }
    );
  }

  const userId = sessionCookie.value;

  try {
    const match = await prisma.match.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    });

    if (!match) {
      return NextResponse.json({ code: 0, data: null });
    }

    return NextResponse.json({
      code: 0,
      data: {
        status: match.status,
        createdAt: match.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Get match status error:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "获取匹配状态失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
