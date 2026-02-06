import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/secondme";

/**
 * POST /api/ai-match/conversations
 * 创建新的 AI 匹配对话会话
 */
export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { jobId } = body as { jobId?: string };

  if (!jobId) {
    return NextResponse.json(
      { code: 400, message: "jobId 为必填" },
      { status: 400 }
    );
  }

  const candidateUserId = sessionCookie.value;

  try {
    // 获取候选人信息
    const candidate = await prisma.user.findUnique({
      where: { id: candidateUserId },
      include: {
        candidateProfile: true,
      },
    });

    if (!candidate || !candidate.candidateProfile) {
      return NextResponse.json(
        { code: 403, message: "请先完善候选人资料" },
        { status: 403 }
      );
    }

    // 获取职位信息
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

    // 检查是否已有对话记录
    const existingConversation = await prisma.aIMatchConversation.findUnique({
      where: {
        userId_jobId: {
          userId: candidateUserId,
          jobId,
        },
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        code: 0,
        data: {
          conversationId: existingConversation.id,
          status: existingConversation.status,
          currentTurn: existingConversation.currentTurn,
        },
      });
    }

    // 获取招聘方的 SecondMe 信息
    const employer = job.employer;
    if (!employer || !employer.user) {
      return NextResponse.json(
        { code: 400, message: "职位所属招聘方未登录 SecondMe" },
        { status: 400 }
      );
    }

    // 创建对话会话
    const conversation = await prisma.aIMatchConversation.create({
      data: {
        userId: candidateUserId,
        jobId,
        candidateSecondMeUserId: candidate.secondmeUserId,
        employerSecondMeUserId: employer.user.secondmeUserId,
        status: "pending",
        matchThreshold: 60,
        currentTurn: 0,
        conversationHistory: [],
      },
    });

    return NextResponse.json({
      code: 0,
      data: {
        conversationId: conversation.id,
        status: conversation.status,
        currentTurn: conversation.currentTurn,
      },
    });
  } catch (error: any) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "创建对话失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
