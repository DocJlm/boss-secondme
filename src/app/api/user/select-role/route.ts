import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/user/select-role
 * 用户选择身份（候选人/招聘方）
 */
export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { role } = body as { role?: "candidate" | "employer" };

  if (!role || (role !== "candidate" && role !== "employer")) {
    return NextResponse.json(
      { code: 400, message: "role 必须为 'candidate' 或 'employer'" },
      { status: 400 }
    );
  }

  const userId = sessionCookie.value;

  try {
    if (role === "candidate") {
      // 检查是否已有候选人资料
      const existing = await prisma.candidateProfile.findUnique({
        where: { userId },
      });

      if (!existing) {
        // 创建默认候选人资料
        await prisma.candidateProfile.create({
          data: {
            userId,
            name: null,
            title: null,
            city: null,
            yearsExp: null,
            skills: null,
            bio: null,
          },
        });
      }
    } else {
      // 检查是否已有招聘方资料
      const existing = await prisma.employerProfile.findUnique({
        where: { userId },
      });

      if (!existing) {
        // 需要先创建公司
        const company = await prisma.company.create({
          data: {
            name: "未命名公司",
            city: null,
            website: null,
            intro: null,
          },
        });

        // 创建招聘方资料
        await prisma.employerProfile.create({
          data: {
            userId,
            companyId: company.id,
            name: null,
            title: null,
          },
        });
      }
    }

    return NextResponse.json({ code: 0, message: "身份选择成功" });
  } catch (error: any) {
    console.error("选择身份失败:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "选择身份失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
