import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/secondme";
import {
  buildCandidateSystemPrompt,
  buildEmployerSystemPrompt,
  startAutoConversation,
  executeConversationTurn, // 保留用于向后兼容
} from "@/lib/ai-match";

/**
 * POST /api/ai-match/conversations/[id]/turn
 * 执行一轮对话
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
  const candidateUserId = sessionCookie.value;

  try {
    // 获取对话记录
    const conversation = await prisma.aIMatchConversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          include: {
            candidateProfile: true,
          },
        },
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
    });

    if (!conversation) {
      return NextResponse.json(
        { code: 404, message: "对话不存在" },
        { status: 404 }
      );
    }

    if (conversation.userId !== candidateUserId) {
      return NextResponse.json(
        { code: 403, message: "无权访问此对话" },
        { status: 403 }
      );
    }

    if (conversation.status !== "pending") {
      return NextResponse.json(
        { code: 400, message: "对话已完成或已失败" },
        { status: 400 }
      );
    }

    if (conversation.currentTurn >= 5) {
      return NextResponse.json(
        { code: 400, message: "对话已完成 5 轮" },
        { status: 400 }
      );
    }

    // 获取候选人和招聘方的 accessToken
    const candidateToken = await getValidAccessToken(conversation.userId);
    if (!candidateToken) {
      return NextResponse.json(
        { code: 401, message: "无法获取候选人的 accessToken" },
        { status: 401 }
      );
    }

    const employerUserId = conversation.job.employer.userId;
    const employerToken = await getValidAccessToken(employerUserId);
    if (!employerToken) {
      return NextResponse.json(
        { code: 401, message: "无法获取招聘方的 accessToken" },
        { status: 401 }
      );
    }

    // 构建系统提示词
    const candidateProfile = conversation.user.candidateProfile!;
    const candidateSystemPrompt = buildCandidateSystemPrompt(candidateProfile, {
      title: conversation.job.title,
      companyName: conversation.job.company?.name || "未知公司",
    });

    const employerSystemPrompt = buildEmployerSystemPrompt(conversation.job, {
      name: conversation.job.company?.name || "未知公司",
      city: conversation.job.company?.city || null,
      intro: conversation.job.company?.intro || null,
    });

    // 使用自动对话函数完成剩余轮次
    const existingHistory = (conversation.conversationHistory || []) as Array<{
      turn: number;
      role: "candidate" | "employer";
      content: string;
    }>;

    const autoConversationResult = await startAutoConversation(
      candidateToken,
      employerToken,
      candidateSystemPrompt,
      employerSystemPrompt,
      5, // 最大 5 轮
      existingHistory,
      conversation.candidateConversationId || undefined,
      conversation.employerConversationId || undefined
    );

    // 更新对话记录
    const finalTurn = autoConversationResult.conversationHistory.length;
    const updatedConversation = await prisma.aIMatchConversation.update({
      where: { id: conversationId },
      data: {
        currentTurn: finalTurn,
        conversationHistory: autoConversationResult.conversationHistory,
        candidateConversationId: autoConversationResult.candidateConversationId,
        employerConversationId: autoConversationResult.employerConversationId,
        status: finalTurn >= 5 ? "completed" : "pending",
      },
    });

    const lastMessages = autoConversationResult.conversationHistory.slice(existingHistory.length);
    const lastCandidateMessage = lastMessages.find(m => m.role === "candidate")?.content || "";
    const lastEmployerMessage = lastMessages.find(m => m.role === "employer")?.content || "";

    return NextResponse.json({
      code: 0,
      data: {
        turn: finalTurn,
        candidateMessage: lastCandidateMessage,
        employerMessage: lastEmployerMessage,
        isCompleted: finalTurn >= 5,
        totalHistory: autoConversationResult.conversationHistory.length,
      },
    });
  } catch (error: any) {
    console.error("Execute turn error:", error);
    
    // 更新对话状态为失败
    await prisma.aIMatchConversation.update({
      where: { id: conversationId },
      data: { status: "failed" },
    }).catch(() => {});

    return NextResponse.json(
      {
        code: 500,
        message: "执行对话失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
