import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/profile/init
 *
 * 初始化当前登录用户的角色信息：
 * body: { role: "candidate" | "employer", name?: string, title?: string, companyName?: string }
 */
export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const role = body.role as "candidate" | "employer" | undefined;

  if (!role || (role !== "candidate" && role !== "employer")) {
    return NextResponse.json(
      { code: 400, message: "role 必须是 candidate 或 employer" },
      { status: 400 }
    );
  }

  const userId = sessionCookie.value;

  try {
    // 获取用户的 SecondMe 信息（包括 name、avatar）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, avatar: true },
    });

    if (role === "candidate") {
      const yearsExpValue = body.yearsExp !== undefined && body.yearsExp !== null && body.yearsExp !== ""
        ? (typeof body.yearsExp === "string" ? parseInt(body.yearsExp) : body.yearsExp)
        : null;

      // 优先使用 SecondMe 的 name，如果没有则使用表单提交的 name
      const candidateName = user?.name || body.name || null;

      const profile = await prisma.candidateProfile.upsert({
        where: { userId },
        update: {
          name: candidateName,
          title: body.title ?? undefined,
          city: body.city ?? undefined,
          yearsExp: body.yearsExp !== undefined ? yearsExpValue : undefined,
          skills: body.skills ?? undefined,
          bio: body.bio ?? undefined,
        },
        create: {
          userId,
          name: candidateName,
          title: body.title ?? null,
          city: body.city ?? null,
          yearsExp: yearsExpValue,
          skills: body.skills ?? null,
          bio: body.bio ?? null,
        },
      });

      return NextResponse.json({ code: 0, data: { role, profileId: profile.id } });
    }

    // employer
    let companyId: string | null = null;
    if (body.companyName) {
      // 先检查是否已经存在这个雇主 profile，如果有，复用已有的 companyId
      const existingEmployer = await prisma.employerProfile.findUnique({
        where: { userId },
      });

      if (existingEmployer?.companyId) {
        // 如果已有公司，复用
        companyId = existingEmployer.companyId;
      } else {
        // 否则创建新公司
        const company = await prisma.company.create({
          data: {
            name: body.companyName,
            city: body.companyCity ?? null,
            website: body.companyWebsite ?? null,
            intro: body.companyIntro ?? null,
          },
        });
        companyId = company.id;
      }
    }

    // 优先使用 SecondMe 的 name，如果没有则使用表单提交的 name
    const employerName = user?.name || body.name || null;

    const employer = await prisma.employerProfile.upsert({
      where: { userId },
      update: {
        name: employerName,
        title: body.title ?? undefined,
        companyId: companyId ?? undefined,
      },
      create: {
        userId,
        name: employerName,
        title: body.title ?? null,
        companyId,
      },
    });

    return NextResponse.json({
      code: 0,
      data: { role, employerId: employer.id, companyId },
    });
  } catch (error: any) {
    console.error("Profile init error:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "初始化失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

