import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { MatchChatClient } from "./MatchChatClient";

async function getMatchData(candidateUserId: string, jobId: string, currentUserId: string) {
  try {
    // 获取候选人信息（包含 route）
    const candidate = await prisma.user.findUnique({
      where: { id: candidateUserId },
      include: {
        candidateProfile: true,
      },
    });

    if (!candidate) {
      console.error(`候选人不存在: ${candidateUserId}`);
      return null;
    }

    if (!candidate.candidateProfile) {
      console.error(`候选人没有 profile: ${candidateUserId}`);
      return null;
    }

    if (!candidate.secondmeUserId) {
      console.error(`候选人没有 secondmeUserId: ${candidateUserId}`);
      return null;
    }

    // 获取职位信息
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true,
        employer: {
          include: {
            user: {
              select: {
                id: true,
                secondmeUserId: true,
                avatar: true,
                name: true,
                route: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      console.error(`职位不存在: ${jobId}`);
      return null;
    }

    if (!job.employer?.user) {
      console.error(`职位没有关联的招聘方用户: ${jobId}`);
      return null;
    }

    if (!job.employer.user.secondmeUserId) {
      console.error(`招聘方没有 secondmeUserId: ${job.employer.userId}`);
      return null;
    }

    // 检查或创建对话记录
    let conversation = await prisma.aIMatchConversation.findUnique({
      where: {
        userId_jobId: {
          userId: candidateUserId,
          jobId: jobId,
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.aIMatchConversation.create({
        data: {
          userId: candidateUserId,
          jobId: jobId,
          candidateSecondMeUserId: candidate.secondmeUserId,
          employerSecondMeUserId: job.employer.user.secondmeUserId,
          status: "pending",
          matchThreshold: 60,
          currentTurn: 0,
          conversationHistory: [],
        },
      });
    }

    return {
      candidate,
      job,
      conversation,
    };
  } catch (error: any) {
    console.error("getMatchData 错误:", error);
    return null;
  }
}

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }> | { userId: string };
  searchParams: Promise<{ jobId?: string }> | { jobId?: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const candidateUserId = resolvedParams.userId;
  const jobId = resolvedSearchParams.jobId;

  if (!jobId) {
    notFound();
  }

  // 检查用户是否登录
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value ?? null;

  if (!sessionUserId) {
    redirect("/api/auth/login");
  }

  const matchData = await getMatchData(candidateUserId, jobId, sessionUserId);

  if (!matchData) {
    console.error("匹配数据获取失败:", {
      candidateUserId,
      jobId,
      sessionUserId,
    });
    notFound();
  }

  // 检查权限：当前用户必须是候选人本人，或者是该职位的招聘方
  const isCandidate = sessionUserId === candidateUserId;
  const isEmployer = sessionUserId === matchData.job.employer.userId;

  if (!isCandidate && !isEmployer) {
    console.error("无权访问此匹配:", {
      sessionUserId,
      candidateUserId,
      employerUserId: matchData.job.employer.userId,
    });
    notFound();
  }

  // 查找或创建 Match 记录
  let match = await prisma.match.findUnique({
    where: {
      userId_jobId: {
        userId: candidateUserId,
        jobId: jobId,
      },
    },
  });

  if (!match) {
    match = await prisma.match.create({
      data: {
        userId: candidateUserId,
        jobId: jobId,
        status: "liked",
        unlocked: false,
      },
    });
  }

  // 获取对话历史记录
  const conversationHistory = (matchData.conversation.conversationHistory || []) as Array<{
    turn: number;
    role: "candidate" | "employer";
    content: string;
  }>;
  
  // 检查对话是否已完成
  const isConversationCompleted = matchData.conversation.status === "completed";
  const matchScore = matchData.conversation.matchScore;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <MatchChatClient
        candidateProfile={matchData.candidate.candidateProfile!}
        candidateAvatar={matchData.candidate.avatar}
        candidateName={matchData.candidate.name}
        job={matchData.job}
        employerAvatar={matchData.job.employer.user.avatar}
        employerName={matchData.job.employer.user.name}
        conversationId={matchData.conversation.id}
        matchId={match.id}
        isCandidate={isCandidate}
        candidateUserId={candidateUserId}
        employerUserId={matchData.job.employer.userId}
        candidateSecondMeUserId={matchData.candidate.secondmeUserId}
        employerSecondMeUserId={matchData.job.employer.user.secondmeUserId}
        candidateRoute={matchData.candidate.route}
        employerRoute={matchData.job.employer.user.route}
        initialMessages={conversationHistory}
        initialMatchScore={matchScore}
        isCompleted={isConversationCompleted}
      />
    </div>
  );
}
