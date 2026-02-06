import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/matches
 * 获取当前用户的所有匹配记录（仅 liked 状态）
 */
export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const userId = sessionCookie.value;

  try {
    const matches = await prisma.match.findMany({
      where: {
        userId,
        status: "liked",
      },
      include: {
        job: {
          include: {
            company: true,
            employer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ code: 0, data: matches });
  } catch (error: any) {
    console.error("Get matches error:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "获取匹配列表失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
