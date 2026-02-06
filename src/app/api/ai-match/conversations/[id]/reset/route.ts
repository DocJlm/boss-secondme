import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/ai-match/conversations/[id]/reset
 * 重置对话状态，允许重新匹配
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const conversationId = resolvedParams.id;
  const currentUserId = sessionCookie.value;

  try {
    // 获取对话记录
    const conversation = await prisma.aIMatchConversation.findUnique({
      where: { id: conversationId },
      include: {
        job: {
          include: {
            employer: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { code: 404, message: "对话不存在" },
        { status: 404 }
      );
    }

    // 检查权限：当前用户必须是候选人本人，或者是该职位的招聘方
    const isCandidate = conversation.userId === currentUserId;
    const isEmployer = conversation.job.employer.userId === currentUserId;

    if (!isCandidate && !isEmployer) {
      return NextResponse.json(
        { code: 403, message: "无权重置此对话" },
        { status: 403 }
      );
    }

    // 重置对话状态
    await prisma.aIMatchConversation.update({
      where: { id: conversationId },
      data: {
        status: "pending",
        currentTurn: 0,
        conversationHistory: [],
        matchScore: null,
        evaluationReason: null,
        candidateConversationId: null,
        employerConversationId: null,
      },
    });

    return NextResponse.json({ code: 0, message: "对话已重置，可以重新匹配" });
  } catch (error: any) {
    console.error("重置对话错误:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "重置对话失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
