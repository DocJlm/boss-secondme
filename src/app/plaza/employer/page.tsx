import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EmployerPlazaClient } from "./EmployerPlazaClient";
import { calculateMatchScore } from "@/lib/recommendation";

async function getCandidatesForJob(job: any) {
  // 查询所有候选人，按创建时间倒序排列
  const allCandidates = await prisma.candidateProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          secondmeUserId: true,
          avatar: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 调试日志：记录查询到的候选人总数
  if (process.env.NODE_ENV === "development") {
    console.log(`查询到 ${allCandidates.length} 个候选人`);
    const withoutSecondMe = allCandidates.filter(c => !c.user.secondmeUserId);
    if (withoutSecondMe.length > 0) {
      console.log(`其中 ${withoutSecondMe.length} 个候选人没有 secondmeUserId（但仍会显示）`);
    }
  }

  // 不再过滤 secondmeUserId，允许显示所有候选人
  // 即使没有 secondmeUserId 的候选人也可以显示（只是不能进行 AI 匹配）

  // 计算匹配度并排序
  const candidatesWithScores = allCandidates
    .map((candidate) => {
      const matchScore = calculateMatchScore(candidate, job);
      return {
        candidate,
        matchScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
    // 移除 slice 限制，返回所有匹配的候选人

  return candidatesWithScores;
}

export default async function EmployerPlazaPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value ?? null;

  if (!sessionUserId) {
    redirect("/api/auth/login");
  }

  // 检查用户是否有招聘方身份
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      employerProfile: {
        include: {
          company: true,
          jobs: {
            where: {
              status: "open",
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!user || !user.employerProfile) {
    redirect("/select-role");
  }

  const jobs = user.employerProfile?.jobs || [];
  // 检查公司信息是否完整
  const hasCompanyInfo = user.employerProfile?.company?.name && 
    user.employerProfile?.company?.name !== "未命名公司" &&
    user.employerProfile?.name;
  
  if (!hasCompanyInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50/30 via-white to-orange-50/30">
        <div className="text-center max-w-md">
          <p className="text-slate-600 mb-4">请先完善公司和招聘人信息</p>
          <p className="text-sm text-slate-500 mb-6">
            完善信息后，你就可以发布职位并开始匹配候选人了
          </p>
          <a
            href="/employer/jobs"
            className="inline-block px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-lg"
          >
            去完善信息并发布职位
          </a>
        </div>
      </div>
    );
  }
  
  if (jobs.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50/30 via-white to-orange-50/30">
        <div className="text-center">
          <p className="text-slate-600 mb-4">请先创建职位</p>
          <a
            href="/employer/jobs"
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            去创建职位
          </a>
        </div>
      </div>
    );
  }

  // 为所有职位计算候选人匹配度，取最高分
  const allCandidatesWithScores = new Map<string, { candidate: any; matchScore: number }>();
  
  for (const job of jobs) {
    const candidatesForJob = await getCandidatesForJob(job);
    // 调试日志：记录每个职位找到的候选人数量
    if (process.env.NODE_ENV === "development") {
      console.log(`职位 ${job.title} 找到 ${candidatesForJob.length} 个候选人`);
    }
    candidatesForJob.forEach((item) => {
      const existing = allCandidatesWithScores.get(item.candidate.id);
      if (!existing || item.matchScore > existing.matchScore) {
        allCandidatesWithScores.set(item.candidate.id, {
          candidate: item.candidate,
          matchScore: item.matchScore,
        });
      }
    });
  }
  
  // 调试日志：记录最终聚合的候选人数量
  if (process.env.NODE_ENV === "development") {
    console.log(`最终聚合到 ${allCandidatesWithScores.size} 个候选人`);
  }

  // 计算每个候选人的匹配度（取最高分），并排序
  const candidatesWithScores = Array.from(allCandidatesWithScores.values())
    .sort((a, b) => b.matchScore - a.matchScore);
  
  // 统计每个候选人的沟通次数
  const candidateIds = candidatesWithScores.map(item => item.candidate.user.id);
  const conversationCounts = await prisma.aIMatchConversation.groupBy({
    by: ['userId'],
    where: {
      userId: { in: candidateIds },
      jobId: { in: jobs.map(j => j.id) },
    },
    _count: {
      id: true,
    },
  });

  const conversationCountMap = new Map(
    conversationCounts.map(item => [item.userId, item._count.id])
  );

  // 添加沟通次数到候选人数据
  const candidatesWithStats = candidatesWithScores.map(item => ({
    ...item,
    conversationCount: conversationCountMap.get(item.candidate.user.id) || 0,
  }));

  // 按匹配度排序（匹配度高的在前面）
  candidatesWithStats.sort((a, b) => b.matchScore - a.matchScore);
  
  const candidates = candidatesWithStats.map(item => item.candidate);
  
  // 排行榜：按沟通次数排序
  const rankingList = [...candidatesWithStats]
    .sort((a, b) => b.conversationCount - a.conversationCount)
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      candidate: item.candidate,
      conversationCount: item.conversationCount,
      matchScore: item.matchScore,
    }));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <EmployerPlazaClient
        candidates={candidates}
        candidatesWithScores={candidatesWithScores}
        employerProfile={user.employerProfile}
        totalCount={candidates.length}
        rankingList={rankingList}
      />
    </div>
  );
}
