import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchesListClient } from "./MatchesListClient";

async function getJobAndMatches(jobId: string, userId: string) {
  // 验证职位是否存在
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      company: true,
      employer: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!job) {
    return null;
  }

  // 验证是否是职位所属的招聘方
  const employer = await prisma.employerProfile.findUnique({
    where: { userId },
  });

  if (!employer || employer.id !== job.employerId) {
    return null;
  }

  // 获取匹配记录
  const matches = await prisma.match.findMany({
    where: {
      jobId,
      status: "liked",
    },
    include: {
      user: {
        include: {
          candidateProfile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return { job, matches };
}

export default async function JobMatchesPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  // 处理 params 可能是 Promise 的情况
  const resolvedParams = await Promise.resolve(params);
  const jobId = resolvedParams.id;

  if (!jobId) {
    notFound();
  }

  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value ?? null;

  if (!sessionUserId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl bg-white px-8 py-10 shadow border border-slate-200 max-w-xl w-full text-center">
          <h1 className="text-xl font-semibold mb-4">请先登录</h1>
          <p className="text-slate-600 mb-6">
            你尚未登录，请回到首页通过 SecondMe 完成登录。
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            返回首页
          </Link>
        </div>
      </main>
    );
  }

  const result = await getJobAndMatches(jobId, sessionUserId);

  if (!result) {
    notFound();
  }

  const { job, matches } = result;

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 font-sans py-12">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-lg border border-slate-200 px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {job.title} - 匹配列表
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              共 {matches.length} 位候选人对该职位感兴趣
            </p>
          </div>
          <Link
            href="/employer/jobs"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            返回职位列表 →
          </Link>
        </div>

        <MatchesListClient matches={matches} />
      </div>
    </main>
  );
}
