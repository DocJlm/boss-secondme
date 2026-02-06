import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/jobs  创建职位（仅招聘方）
 * GET  /api/jobs  列出所有开放职位（候选人浏览）
 */

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, description } = body as {
    title?: string;
    description?: string;
  };

  if (!title || !description) {
    return NextResponse.json(
      { code: 400, message: "title 和 description 为必填" },
      { status: 400 }
    );
  }

  const userId = sessionCookie.value;
  const employer = await prisma.employerProfile.findUnique({
    where: { userId },
  });

  if (!employer) {
    return NextResponse.json(
      { code: 403, message: "当前用户还不是招聘方，请先完成招聘方资料" },
      { status: 403 }
    );
  }

  const job = await prisma.job.create({
    data: {
      employerId: employer.id,
      companyId: employer.companyId,
      title,
      description,
      city: (body as any).city ?? null,
      salaryMin: (body as any).salaryMin ?? null,
      salaryMax: (body as any).salaryMax ?? null,
      salaryCurrency: (body as any).salaryCurrency ?? "CNY",
      tags: (body as any).tags ?? null,
    },
  });

  return NextResponse.json({ code: 0, data: job });
}

export async function GET() {
  const jobs = await prisma.job.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: {
      company: true,
      employer: {
        include: {
          user: true,
        },
      },
    },
  });

  return NextResponse.json({ code: 0, data: jobs });
}

