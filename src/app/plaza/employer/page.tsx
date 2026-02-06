import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EmployerPlazaClient } from "./EmployerPlazaClient";
import { calculateMatchScore } from "@/lib/recommendation";

async function getCandidatesForJob(job: any) {
  // 先查询所有候选人，然后在应用层过滤有 secondmeUserId 的
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
    take: 50, // 多取一些以便过滤
  });

  // 过滤出有 secondmeUserId 的候选人
  const candidatesWithSecondMe = allCandidates.filter(
    (candidate) => candidate.user.secondmeUserId !== null
  );

  // 计算匹配度并排序
  const candidatesWithScores = candidatesWithSecondMe
    .map((candidate) => {
      const matchScore = calculateMatchScore(candidate, job);
      return {
        candidate,
        matchScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);

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

  // 计算每个候选人的匹配度（取最高分），并排序
  const candidatesWithScores = Array.from(allCandidatesWithScores.values())
    .sort((a, b) => b.matchScore - a.matchScore);
  
  const candidates = candidatesWithScores.map(item => item.candidate);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <EmployerPlazaClient
        candidates={candidates}
        candidatesWithScores={candidatesWithScores}
        employerProfile={user.employerProfile}
      />
    </div>
  );
}
