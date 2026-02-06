import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JobDetailClient } from "./JobDetailClient";

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

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  // 处理 params 可能是 Promise 的情况
  const resolvedParams = await Promise.resolve(params);
  const job = await getJob(resolvedParams.id);

  if (!job) {
    notFound();
  }

  // 检查当前用户是否是职位所有者
  let isOwner = false;
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value ?? null;

  if (sessionUserId) {
    const employer = await prisma.employerProfile.findUnique({
      where: { userId: sessionUserId },
    });
    if (employer && employer.id === job.employerId) {
      isOwner = true;
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 font-sans py-12">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-lg border border-slate-200 px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/jobs"
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            ← 返回职位列表
          </Link>
        </div>

        <JobDetailClient job={job} isOwner={isOwner} />
      </div>
    </main>
  );
}
