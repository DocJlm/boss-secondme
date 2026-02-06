import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/match
 * body: { jobId: string, action: "like" | "pass" }
 */
export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const jobId = (body as any).jobId as string | undefined;
  const action = (body as any).action as "like" | "pass" | undefined;

  if (!jobId || !action) {
    return NextResponse.json(
      { code: 400, message: "jobId 和 action 为必填" },
      { status: 400 }
    );
  }

  const status = action === "like" ? "liked" : "passed";
  const userId = sessionCookie.value;

  try {
    // 先验证 jobId 是否存在
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { code: 404, message: "职位不存在" },
        { status: 404 }
      );
    }

    const match = await prisma.match.upsert({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
      update: {
        status,
      },
      create: {
        userId,
        jobId,
        status,
      },
    });

    return NextResponse.json({ code: 0, data: match });
  } catch (error: any) {
    console.error("Match error:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "操作失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

