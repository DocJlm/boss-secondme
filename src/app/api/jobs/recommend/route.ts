import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken } from "@/lib/secondme";
import {
  buildCandidateSystemPrompt,
  buildEmployerSystemPrompt,
  buildEvaluationPrompt,
  startAutoConversation,
  evaluateMatchScore,
} from "@/lib/ai-match";

const MAX_JOBS_TO_PROCESS = parseInt(process.env.AI_MATCH_MAX_JOBS || "10", 10);
const MATCH_THRESHOLD = parseInt(process.env.AI_MATCH_THRESHOLD || "60", 10);
const CONVERSATION_TURNS = parseInt(process.env.AI_MATCH_CONVERSATION_TURNS || "5", 10);

/**
 * 处理单个职位的匹配
 */
async function processJobMatch(
  userId: string,
  job: any,
  candidateProfile: any
): Promise<{
  job: any;
  matchScore: number | null;
  evaluationReason: string | null;
  conversationId: string | null;
}> {
  try {
    // 检查是否已有对话记录
    let conversation = await prisma.aIMatchConversation.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId: job.id,
        },
      },
    });

    // 如果没有对话记录，创建新的
    if (!conversation) {
      // 检查招聘方是否登录 SecondMe
      if (!job.employer?.user) {
        console.warn(`职位 ${job.id} 的招聘方未登录 SecondMe，跳过`);
        return {
          job,
          matchScore: null,
          evaluationReason: null,
          conversationId: null,
        };
      }

      // 获取候选人的 secondmeUserId
      const candidateUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!candidateUser) {
        console.warn(`候选人用户 ${userId} 不存在，跳过职位 ${job.id}`);
        return {
          job,
          matchScore: null,
          evaluationReason: null,
          conversationId: null,
        };
      }

      conversation = await prisma.aIMatchConversation.create({
        data: {
          userId,
          jobId: job.id,
          candidateSecondMeUserId: candidateUser.secondmeUserId,
          employerSecondMeUserId: job.employer.user.secondmeUserId,
          status: "pending",
          matchThreshold: MATCH_THRESHOLD,
          currentTurn: 0,
          conversationHistory: [],
        },
      });
    }

    // 如果对话已完成且已评估，直接返回结果
    if (conversation.status === "completed" && conversation.matchScore !== null) {
      return {
        job,
        matchScore: conversation.matchScore,
        evaluationReason: conversation.evaluationReason,
        conversationId: conversation.id,
      };
    }

    // 如果对话未完成，执行剩余轮次
    if (conversation.status === "pending" && conversation.currentTurn < CONVERSATION_TURNS) {
      const candidateToken = await getValidAccessToken(userId);
      const employerToken = await getValidAccessToken(job.employer.userId);

      if (!candidateToken || !employerToken) {
        console.warn(`无法获取 token，跳过职位 ${job.id}`);
        return {
          job,
          matchScore: null,
          evaluationReason: null,
          conversationId: conversation.id,
        };
      }

      // 构建系统提示词
      const candidateSystemPrompt = buildCandidateSystemPrompt(candidateProfile, {
        title: job.title,
        companyName: job.company?.name || "未知公司",
      });

      const employerSystemPrompt = buildEmployerSystemPrompt(job, {
        name: job.company?.name || "未知公司",
        city: job.company?.city || null,
        intro: job.company?.intro || null,
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
        CONVERSATION_TURNS,
        existingHistory,
        conversation.candidateConversationId || undefined,
        conversation.employerConversationId || undefined
      );

      // 更新对话记录
      const finalTurn = autoConversationResult.conversationHistory.length;
      conversation = await prisma.aIMatchConversation.update({
        where: { id: conversation.id },
        data: {
          currentTurn: finalTurn,
          conversationHistory: autoConversationResult.conversationHistory,
          candidateConversationId: autoConversationResult.candidateConversationId,
          employerConversationId: autoConversationResult.employerConversationId,
          status: finalTurn >= CONVERSATION_TURNS ? "completed" : "pending",
        },
      });
    }

    // 如果对话已完成但未评估，执行评估
    if (conversation.status === "completed" && conversation.matchScore === null) {
      const candidateToken = await getValidAccessToken(userId);
      if (!candidateToken) {
        console.warn(`无法获取候选人的 token，跳过评估职位 ${job.id}`);
        return {
          job,
          matchScore: null,
          evaluationReason: null,
          conversationId: conversation.id,
        };
      }

      const evaluationPrompt = buildEvaluationPrompt(
        candidateProfile,
        job,
        {
          name: job.company?.name || "未知公司",
        },
        conversation.conversationHistory as any[]
      );

      const evaluation = await evaluateMatchScore(candidateToken, evaluationPrompt);

      conversation = await prisma.aIMatchConversation.update({
        where: { id: conversation.id },
        data: {
          matchScore: evaluation.score,
          evaluationReason: evaluation.reason,
        },
      });

      // 如果匹配度 >= 阈值，创建 Match 记录
      if (evaluation.score >= MATCH_THRESHOLD) {
        await prisma.match.upsert({
          where: {
            userId_jobId: {
              userId,
              jobId: job.id,
            },
          },
          update: {
            status: "liked",
          },
          create: {
            userId,
            jobId: job.id,
            status: "liked",
          },
        });
      }
    }

    return {
      job,
      matchScore: conversation.matchScore,
      evaluationReason: conversation.evaluationReason,
      conversationId: conversation.id,
    };
  } catch (error: any) {
    console.error(`处理职位 ${job.id} 匹配失败:`, error);
    // 标记对话为失败（如果已创建）
    try {
      const existingConversation = await prisma.aIMatchConversation.findUnique({
        where: {
          userId_jobId: {
            userId,
            jobId: job.id,
          },
        },
      });
      if (existingConversation) {
        await prisma.aIMatchConversation.update({
          where: { id: existingConversation.id },
          data: { status: "failed" },
        });
      }
    } catch (updateError) {
      // 忽略更新错误
    }
    return {
      job,
      matchScore: null,
      evaluationReason: null,
      conversationId: null,
    };
  }
}

/**
 * GET /api/jobs/recommend
 * 获取 AI 推荐的职位（基于对话匹配）
 */
export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const userId = sessionCookie.value;

  try {
    // 获取候选人资料
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: true,
      },
    });

    if (!user || !user.candidateProfile) {
      return NextResponse.json(
        { code: 403, message: "请先完善候选人资料" },
        { status: 403 }
      );
    }

    // 获取所有开放职位
    const jobs = await prisma.job.findMany({
      where: { status: "open" },
      include: {
        company: true,
        employer: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_JOBS_TO_PROCESS, // 限制处理的职位数量
    });

    if (jobs.length === 0) {
      return NextResponse.json({ code: 0, data: [] });
    }

    // 处理每个职位的匹配
    const results = await Promise.allSettled(
      jobs.map((job) => processJobMatch(userId, job, user.candidateProfile!))
    );

    // 筛选匹配成功的职位（分数 >= 阈值）
    const recommendedJobs = results
      .map((result) => {
        if (result.status === "fulfilled") {
          const { job, matchScore, evaluationReason, conversationId } = result.value;
          if (matchScore !== null && matchScore >= MATCH_THRESHOLD) {
            return {
              ...job,
              recommendationScore: matchScore,
              recommendationReason: evaluationReason || "匹配成功",
              conversationId,
            };
          }
        }
        return null;
      })
      .filter((job) => job !== null)
      .sort((a, b) => (b?.recommendationScore || 0) - (a?.recommendationScore || 0));

    return NextResponse.json({ code: 0, data: recommendedJobs });
  } catch (error: any) {
    console.error("Get job recommendations error:", error);
    return NextResponse.json(
      {
        code: 500,
        message: "获取推荐失败",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
