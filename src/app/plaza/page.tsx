import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PlazaClient } from "./PlazaClient";
import { calculateMatchScore, sortCandidatesByMatchScore } from "@/lib/recommendation";

async function getEmployers(candidateProfile: any) {
  // 先查询所有招聘方，然后在应用层过滤有 secondmeUserId 的
  const allEmployers = await prisma.employerProfile.findMany({
    include: {
      user: {
        select: {
          id: true,
          secondmeUserId: true,
          avatar: true,
          name: true,
        },
      },
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
    take: 50, // 多取一些以便过滤
  });

  // 过滤出有 secondmeUserId 的招聘方
  const employersWithSecondMe = allEmployers.filter(
    (employer) => employer.user.secondmeUserId !== null
  );

  // 计算匹配度并排序（为每个招聘方的每个职位计算匹配度）
  const employersWithScores = employersWithSecondMe
    .filter((employer) => employer.jobs.length > 0)
    .map((employer) => {
      // 为每个职位计算匹配度，取最高分
      const jobScores = employer.jobs.map((job) => ({
        job,
        matchScore: calculateMatchScore(candidateProfile, job),
      }));
      const maxMatchScore = Math.max(...jobScores.map((js) => js.matchScore));
      return {
        employer,
        matchScore: maxMatchScore,
        jobsWithScores: jobScores,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20)
    .map((item) => item.employer);

  return employersWithScores;
}

export default async function PlazaPage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value ?? null;

  if (!sessionUserId) {
    redirect("/api/auth/login");
  }

  // 检查用户是否有候选人身份
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      candidateProfile: true,
    },
  });

  if (!user || !user.candidateProfile) {
    redirect("/select-role");
  }

  const employers = await getEmployers(user.candidateProfile);

  // 计算每个招聘方的匹配度（取最高分）和每个职位的匹配度
  const employersWithScores = employers
    .filter((employer) => employer.jobs.length > 0)
    .map((employer) => {
      const jobScores = employer.jobs.map((job) => ({
        job,
        matchScore: calculateMatchScore(user.candidateProfile!, job),
      }));
      // 按匹配度从高到低排序
      jobScores.sort((a, b) => b.matchScore - a.matchScore);
      const maxMatchScore = jobScores.length > 0 ? jobScores[0].matchScore : 0;
      return {
        employer,
        matchScore: maxMatchScore,
        jobsWithScores: jobScores,
      };
    });

  // 构建 jobsWithScoresMap，key 为 employer.id
  const jobsWithScoresMap = new Map(
    employersWithScores.map((item) => [
      item.employer.id,
      item.jobsWithScores,
    ])
  );

  // 统计每个招聘方的沟通次数
  const employerUserIds = employers.map(e => e.user.id);
  const jobIds = employers.flatMap(e => e.jobs.map(j => j.id));
  const conversationCounts = await prisma.aIMatchConversation.groupBy({
    by: ['jobId'],
    where: {
      userId: sessionUserId,
      jobId: { in: jobIds },
    },
    _count: {
      id: true,
    },
  });

  const conversationCountMap = new Map(
    conversationCounts.map(item => [item.jobId, item._count.id])
  );

  // 为每个招聘方添加沟通次数（取最高值）
  const employersWithStats = employersWithScores.map(item => {
    const employerJobIds = item.employer.jobs.map(j => j.id);
    const maxConversationCount = Math.max(
      ...employerJobIds.map(jobId => conversationCountMap.get(jobId) || 0),
      0
    );
    return {
      employer: item.employer,
      matchScore: item.matchScore,
      conversationCount: maxConversationCount,
    };
  });

  // 按匹配度排序（匹配度高的在前面）
  employersWithStats.sort((a, b) => b.matchScore - a.matchScore);
  
  // 排行榜：按沟通次数排序
  const rankingList = [...employersWithStats]
    .sort((a, b) => b.conversationCount - a.conversationCount)
    .slice(0, 10)
    .map((item, index) => ({
      rank: index + 1,
      employer: item.employer,
      conversationCount: item.conversationCount,
      matchScore: item.matchScore,
    }));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PlazaClient
        employers={employers}
        employersWithScores={employersWithStats.map(item => ({
          employer: item.employer,
          matchScore: item.matchScore,
        }))}
        jobsWithScoresMap={jobsWithScoresMap}
        candidateProfile={user.candidateProfile}
        candidateUserId={sessionUserId}
        totalCount={employers.length}
        rankingList={rankingList}
      />
    </div>
  );
}
