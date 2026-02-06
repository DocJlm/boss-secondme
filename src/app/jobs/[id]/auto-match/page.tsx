import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AutoMatchClient } from "./AutoMatchClient";

async function getJob(id: string) {
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: true,
      employer: {
        include: {
          user: true,
        },
      },
    },
  });

  return job;
}

export default async function AutoMatchPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const job = await getJob(resolvedParams.id);

  if (!job) {
    notFound();
  }

  // 检查用户是否登录
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value ?? null;

  if (!sessionUserId) {
    redirect("/api/auth/login");
  }

  // 检查用户是否有候选人资料
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      candidateProfile: true,
    },
  });

  if (!user || !user.candidateProfile) {
    redirect("/?error=no_profile");
  }

  // 检查招聘方是否登录 SecondMe
  if (!job.employer?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600 mb-4">该职位的招聘方未登录 SecondMe，无法进行自动匹配</p>
          <a href={`/jobs/${job.id}`} className="text-orange-600 hover:text-orange-700">
            返回职位详情
          </a>
        </div>
      </div>
    );
  }

  // 检查或创建对话记录
  let conversation = await prisma.aIMatchConversation.findUnique({
    where: {
      userId_jobId: {
        userId: sessionUserId,
        jobId: job.id,
      },
    },
  });

  if (!conversation) {
    conversation = await prisma.aIMatchConversation.create({
      data: {
        userId: sessionUserId,
        jobId: job.id,
        candidateSecondMeUserId: user.secondmeUserId,
        employerSecondMeUserId: job.employer.user.secondmeUserId,
        status: "pending",
        matchThreshold: 60,
        currentTurn: 0,
        conversationHistory: [],
      },
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AutoMatchClient
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.company?.name || "未知公司"}
        conversationId={conversation.id}
        candidateProfile={user.candidateProfile}
      />
    </div>
  );
}
