import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, callSecondMeChatStreamWithCallback } from "@/lib/secondme";
import {
  buildCandidateSystemPrompt,
  buildEmployerSystemPrompt,
  evaluateMatchScore,
  buildEvaluationPrompt,
} from "@/lib/ai-match";

const CONVERSATION_TURNS = 5;
const MATCH_THRESHOLD = 60;

/**
 * GET /api/ai-match/conversations/[id]/auto
 * 自动执行对话并流式返回结果
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return new Response(
      JSON.stringify({ type: "error", message: "未登录" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const resolvedParams = await Promise.resolve(params);
  const conversationId = resolvedParams.id;
  const currentUserId = sessionCookie.value;

  // 创建流式响应
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

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
          sendEvent({ type: "error", message: "对话不存在" });
          controller.close();
          return;
        }

        // 检查权限：当前用户必须是候选人本人，或者是该职位的招聘方
        const isCandidate = conversation.userId === currentUserId;
        const isEmployer = conversation.job.employer.userId === currentUserId;

        if (!isCandidate && !isEmployer) {
          sendEvent({ type: "error", message: "无权访问此对话" });
          controller.close();
          return;
        }

        // 如果对话已完成，直接返回结果
        if (conversation.status === "completed" && conversation.matchScore !== null) {
          sendEvent({
            type: "message",
            message: { turn: 0, role: "system", content: "对话已完成" },
          });
          sendEvent({ type: "score", score: conversation.matchScore });
          controller.close();
          return;
        }

        // 获取候选人和招聘方的 accessToken
        const candidateToken = await getValidAccessToken(conversation.userId);
        if (!candidateToken) {
          sendEvent({ type: "error", message: "无法获取候选人的 accessToken" });
          controller.close();
          return;
        }

        const employerUserId = conversation.job.employer.userId;
        const employerToken = await getValidAccessToken(employerUserId);
        if (!employerToken) {
          sendEvent({ type: "error", message: "无法获取招聘方的 accessToken" });
          controller.close();
          return;
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

        // 获取已有对话历史
        const existingHistory = (conversation.conversationHistory || []) as Array<{
          turn: number;
          role: "candidate" | "employer";
          content: string;
        }>;

        // 如果已有对话，先发送已有消息
        if (existingHistory.length > 0) {
          for (const msg of existingHistory) {
            sendEvent({ type: "message", message: msg });
            const progress = (msg.turn / CONVERSATION_TURNS) * 100;
            sendEvent({ type: "progress", progress });
          }
        }

        // 执行自动对话（流式版本）
        const conversationHistory = [...existingHistory];
        let currentCandidateConversationId = conversation.candidateConversationId || "";
        let currentEmployerConversationId = conversation.employerConversationId || null;
        let currentTurn = Math.max(...conversationHistory.map(m => m.turn), 0);

        // 第 1 轮：候选人先发言（如果还没有历史记录）
        if (conversationHistory.length === 0) {
          // 先创建消息对象
          const candidateMessageObj = {
            turn: 1,
            role: "candidate" as const,
            content: "",
          };
          conversationHistory.push(candidateMessageObj);
          sendEvent({ type: "message", message: { ...candidateMessageObj } });

          const initialMessage = "你好，我对这个职位很感兴趣，想了解一下详情。";
          const candidateResult = await callSecondMeChatStreamWithCallback(
            candidateToken,
            initialMessage,
            currentCandidateConversationId || undefined,
            candidateSystemPrompt,
            (chunk: string) => {
              // 实时更新并发送流式内容
              candidateMessageObj.content += chunk;
              sendEvent({ type: "message", message: { ...candidateMessageObj } });
            }
          );

          if (candidateResult.code !== 0 || !candidateResult.data) {
            sendEvent({ type: "error", message: candidateResult.message || "候选人对话失败" });
            controller.close();
            return;
          }

          // 更新消息内容（如果流式回调没有完全更新）
          if (candidateResult.data) {
            const finalContent = candidateResult.data?.response || candidateResult.data?.message || candidateResult.data?.content || "";
            if (finalContent && finalContent !== candidateMessageObj.content) {
              candidateMessageObj.content = finalContent;
              sendEvent({ type: "message", message: { ...candidateMessageObj } });
            }
          }
          
          currentCandidateConversationId = candidateResult.data?.sessionId || candidateResult.data?.conversationId || currentCandidateConversationId;
          sendEvent({ type: "progress", progress: (1 / CONVERSATION_TURNS) * 100 });
          currentTurn = 1;
        }

        // 后续轮次：交替对话（流式）
        while (currentTurn < CONVERSATION_TURNS) {
          const lastMessage = conversationHistory[conversationHistory.length - 1];
          const nextTurn = currentTurn + 1;

          if (lastMessage.role === "candidate") {
            // 招聘方回应
            const employerMessageObj = {
              turn: nextTurn,
              role: "employer" as const,
              content: "",
            };
            conversationHistory.push(employerMessageObj);
            sendEvent({ type: "message", message: { ...employerMessageObj } });

            const employerResult = await callSecondMeChatStreamWithCallback(
              employerToken,
              lastMessage.content,
              currentEmployerConversationId || undefined,
              currentEmployerConversationId ? undefined : employerSystemPrompt,
              (chunk: string) => {
                // 实时更新并发送流式内容
                employerMessageObj.content += chunk;
                sendEvent({ type: "message", message: { ...employerMessageObj } });
              }
            );

            if (employerResult.code !== 0 || !employerResult.data) {
              sendEvent({ type: "error", message: employerResult.message || "招聘方对话失败" });
              break;
            }

            // 更新消息内容（如果流式回调没有完全更新）
            if (employerResult.data) {
              const finalContent = employerResult.data?.response || employerResult.data?.message || employerResult.data?.content || "";
              if (finalContent && finalContent !== employerMessageObj.content) {
                employerMessageObj.content = finalContent;
                sendEvent({ type: "message", message: { ...employerMessageObj } });
              }
            }
            
            currentEmployerConversationId = employerResult.data?.sessionId || employerResult.data?.conversationId || currentEmployerConversationId;
          } else {
            // 候选人回应
            const candidateMessageObj = {
              turn: nextTurn,
              role: "candidate" as const,
              content: "",
            };
            conversationHistory.push(candidateMessageObj);
            sendEvent({ type: "message", message: { ...candidateMessageObj } });

            const candidateResult = await callSecondMeChatStreamWithCallback(
              candidateToken,
              lastMessage.content,
              currentCandidateConversationId || undefined,
              currentCandidateConversationId ? undefined : candidateSystemPrompt,
              (chunk: string) => {
                // 实时更新并发送流式内容
                candidateMessageObj.content += chunk;
                sendEvent({ type: "message", message: { ...candidateMessageObj } });
              }
            );

            if (candidateResult.code !== 0 || !candidateResult.data) {
              sendEvent({ type: "error", message: candidateResult.message || "候选人对话失败" });
              break;
            }

            // 更新消息内容（如果流式回调没有完全更新）
            if (candidateResult.data) {
              const finalContent = candidateResult.data?.response || candidateResult.data?.message || candidateResult.data?.content || "";
              if (finalContent && finalContent !== candidateMessageObj.content) {
                candidateMessageObj.content = finalContent;
                sendEvent({ type: "message", message: { ...candidateMessageObj } });
              }
            }
            
            currentCandidateConversationId = candidateResult.data?.sessionId || candidateResult.data?.conversationId || currentCandidateConversationId;
          }

          sendEvent({ type: "progress", progress: (nextTurn / CONVERSATION_TURNS) * 100 });
          currentTurn = nextTurn;
        }

        const autoConversationResult = {
          conversationHistory,
          candidateConversationId: currentCandidateConversationId,
          employerConversationId: currentEmployerConversationId,
        };

        // 更新对话记录
        const finalTurn = autoConversationResult.conversationHistory.length;
        await prisma.aIMatchConversation.update({
          where: { id: conversationId },
          data: {
            currentTurn: finalTurn,
            conversationHistory: autoConversationResult.conversationHistory,
            candidateConversationId: autoConversationResult.candidateConversationId,
            employerConversationId: autoConversationResult.employerConversationId,
            status: "completed",
          },
        });

        // 评估匹配度
        const evaluationPrompt = buildEvaluationPrompt(
          candidateProfile,
          conversation.job,
          {
            name: conversation.job.company?.name || "未知公司",
          },
          autoConversationResult.conversationHistory
        );

        const evaluation = await evaluateMatchScore(candidateToken, evaluationPrompt);

        // 更新对话记录
        await prisma.aIMatchConversation.update({
          where: { id: conversationId },
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

        // 发送评分结果
        sendEvent({ type: "score", score: evaluation.score });
        controller.close();
      } catch (error: any) {
        console.error("自动匹配错误:", error);
        sendEvent({ type: "error", message: error.message || "自动匹配失败" });
        
        // 更新对话状态为失败
        await prisma.aIMatchConversation.update({
          where: { id: conversationId },
          data: { status: "failed" },
        }).catch(() => {});

        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
