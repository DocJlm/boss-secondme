import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { JobCard } from "./JobCard";
import { JobsListClient } from "./JobsListClient";

async function getJobs() {
  const jobs = await prisma.job.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    include: {
      company: true,
      employer: {
        include: {
          user: true,
        },
      },
    },
  });

  return jobs;
}

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 font-sans py-12">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-lg border border-slate-200 px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              职位列表（候选人视角）
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              浏览职位，点击「点赞」表示感兴趣，「略过」表示不感兴趣。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/jobs/recommend"
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              AI 推荐
            </Link>
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              返回首页
            </Link>
          </div>
        </div>

        <JobsListClient jobs={jobs} />
      </div>
    </main>
  );
}

