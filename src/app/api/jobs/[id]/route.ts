import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/jobs/[id]  获取单个职位详情
 * PUT /api/jobs/[id]  更新职位信息（仅招聘方）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(params);
  const jobId = resolvedParams.id;

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        employer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { code: 404, message: "职位不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ code: 0, data: job });
  } catch (error: any) {
    console.error("Get job error:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "获取职位失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
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
        { code: 403, message: "无权编辑此职位" },
        { status: 403 }
      );
    }

    // 解析请求体
    const body = await req.json().catch(() => ({}));
    const {
      title,
      description,
      city,
      salaryMin,
      salaryMax,
      salaryCurrency,
      tags,
      status,
    } = body as {
      title?: string;
      description?: string;
      city?: string;
      salaryMin?: number;
      salaryMax?: number;
      salaryCurrency?: string;
      tags?: string;
      status?: string;
    };

    // 更新职位
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(city !== undefined && { city: city || null }),
        ...(salaryMin !== undefined && { salaryMin: salaryMin || null }),
        ...(salaryMax !== undefined && { salaryMax: salaryMax || null }),
        ...(salaryCurrency !== undefined && { salaryCurrency: salaryCurrency || "CNY" }),
        ...(tags !== undefined && { tags: tags || null }),
        ...(status !== undefined && { status }),
      },
      include: {
        company: true,
        employer: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({ code: 0, data: updatedJob });
  } catch (error: any) {
    console.error("Update job error:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "更新职位失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
