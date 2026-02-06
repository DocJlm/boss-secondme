import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/secondme";
import { buildEvaluationPrompt, evaluateMatchScore } from "@/lib/ai-match";

/**
 * POST /api/ai-match/conversations/[id]/evaluate
 * 完成对话并评估匹配度
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

    if (conversation.status !== "completed") {
      return NextResponse.json(
        { code: 400, message: "对话尚未完成，当前轮数：" + conversation.currentTurn },
        { status: 400 }
      );
    }

    if (conversation.matchScore !== null) {
      // 已经评估过了，直接返回
      return NextResponse.json({
        code: 0,
        data: {
          score: conversation.matchScore,
          reason: conversation.evaluationReason || "",
          isMatched: conversation.matchScore >= conversation.matchThreshold,
        },
      });
    }

    // 获取候选人的 accessToken
    const candidateToken = await getValidAccessToken(conversation.userId);
    if (!candidateToken) {
      return NextResponse.json(
        { code: 401, message: "无法获取候选人的 accessToken" },
        { status: 401 }
      );
    }

    // 构建评估提示词
    const candidateProfile = conversation.user.candidateProfile!;
    const evaluationPrompt = buildEvaluationPrompt(
      candidateProfile,
      conversation.job,
      {
        name: conversation.job.company?.name || "未知公司",
      },
      conversation.conversationHistory as any[]
    );

    // 执行评估
    const evaluation = await evaluateMatchScore(candidateToken, evaluationPrompt);

    // 更新对话记录
    const updatedConversation = await prisma.aIMatchConversation.update({
      where: { id: conversationId },
      data: {
        matchScore: evaluation.score,
        evaluationReason: evaluation.reason,
      },
    });

    // 如果匹配度 >= 阈值，创建 Match 记录
    if (evaluation.score >= conversation.matchThreshold) {
      await prisma.match.upsert({
        where: {
          userId_jobId: {
            userId: conversation.userId,
            jobId: conversation.jobId,
          },
        },
        update: {
          status: "liked",
        },
        create: {
          userId: conversation.userId,
          jobId: conversation.jobId,
          status: "liked",
        },
      });
    }

    return NextResponse.json({
      code: 0,
      data: {
        score: evaluation.score,
        reason: evaluation.reason,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        isMatched: evaluation.score >= conversation.matchThreshold,
      },
    });
  } catch (error: any) {
    console.error("Evaluate match error:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "评估匹配度失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
