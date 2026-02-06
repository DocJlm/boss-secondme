import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/profile/edit
 *
 * 更新当前登录用户的角色信息：
 * body: { role: "candidate" | "employer", name?: string, title?: string, companyName?: string, ... }
 */
export async function PUT(req: NextRequest) {
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
    if (role === "candidate") {
      // 检查用户是否有候选人身份
      const existingProfile = await prisma.candidateProfile.findUnique({
        where: { userId },
      });

      if (!existingProfile) {
        return NextResponse.json(
          { code: 404, message: "候选人资料不存在，请先创建" },
          { status: 404 }
        );
      }

      const yearsExpValue = body.yearsExp !== undefined && body.yearsExp !== null && body.yearsExp !== ""
        ? (typeof body.yearsExp === "string" ? parseInt(body.yearsExp) : body.yearsExp)
        : undefined;

      const profile = await prisma.candidateProfile.update({
        where: { userId },
        data: {
          ...(body.name !== undefined && { name: body.name }),
          ...(body.title !== undefined && { title: body.title }),
          ...(body.city !== undefined && { city: body.city }),
          ...(body.yearsExp !== undefined && yearsExpValue !== undefined && { yearsExp: yearsExpValue }),
          ...(body.skills !== undefined && { skills: body.skills }),
          ...(body.bio !== undefined && { bio: body.bio }),
        },
      });

      return NextResponse.json({ code: 0, data: { role, profileId: profile.id } });
    }

    // employer
    const existingProfile = await prisma.employerProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { code: 404, message: "招聘方资料不存在，请先创建" },
        { status: 404 }
      );
    }

    let companyId: string | null = null;
    if (body.companyName) {
      // 如果已有公司，更新公司信息；否则创建新公司
      if (existingProfile.companyId) {
        await prisma.company.update({
          where: { id: existingProfile.companyId },
          data: {
            name: body.companyName,
            ...(body.companyCity !== undefined && { city: body.companyCity }),
            ...(body.companyWebsite !== undefined && { website: body.companyWebsite }),
            ...(body.companyIntro !== undefined && { intro: body.companyIntro }),
          },
        });
        companyId = existingProfile.companyId;
      } else {
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

    const employer = await prisma.employerProfile.update({
      where: { userId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.title !== undefined && { title: body.title }),
        ...(companyId !== null && { companyId }),
      },
    });

    return NextResponse.json({ code: 0, data: { role, profileId: employer.id } });
  } catch (error: any) {
    console.error("更新资料失败:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "更新资料失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
