import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/jobs/[id]/matches
 * 获取某个职位的所有匹配记录（仅 liked 状态）
 * 验证：必须是职位所属的招聘方
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const jobId = resolvedParams.id;
  const userId = sessionCookie.value;

  try {
    // 验证职位是否存在
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        employer: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { code: 404, message: "职位不存在" },
        { status: 404 }
      );
    }

    // 验证是否是职位所属的招聘方
    const employer = await prisma.employerProfile.findUnique({
      where: { userId },
    });

    if (!employer || employer.id !== job.employerId) {
      return NextResponse.json(
        { code: 403, message: "无权查看此职位的匹配列表" },
        { status: 403 }
      );
    }

    // 获取匹配记录
    const matches = await prisma.match.findMany({
      where: {
        jobId,
        status: "liked",
      },
      include: {
        user: {
          include: {
            candidateProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ code: 0, data: matches });
  } catch (error: any) {
    console.error("Get job matches error:", error);
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
