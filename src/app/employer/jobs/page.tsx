import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { EmployerJobsClient } from "./EmployerJobsClient";

async function getData() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value ?? null;

  if (!sessionUserId) {
    return { loggedIn: false as const };
  }

  const employer = await prisma.employerProfile.findUnique({
    where: { userId: sessionUserId },
    include: {
      company: true,
      jobs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!employer) {
    return { loggedIn: true as const, hasEmployerProfile: false as const };
  }

  return {
    loggedIn: true as const,
    hasEmployerProfile: true as const,
    employer,
  };
}

export default async function EmployerJobsPage() {
  const data = await getData();

  if (!data.loggedIn) {
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

  if (!data.hasEmployerProfile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-xl bg-white px-8 py-10 shadow border border-slate-200 max-w-xl w-full text-center">
          <h1 className="text-xl font-semibold mb-4">请先完成招聘方资料</h1>
          <p className="text-slate-600 mb-6">
            当前账号还没有招聘方身份。下一步我会帮你补一个简单的初始化界面，先用接口配合工具测试即可。
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

  const { employer } = data;

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 font-sans py-12">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-lg border border-slate-200 px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              我的职位
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              公司：{employer.company?.name ?? "未填写公司"} · 招聘人：{employer.name ?? "未填写姓名"}
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            返回首页
          </Link>
        </div>

        <EmployerJobsClient initialJobs={employer.jobs} />
      </div>
    </main>
  );
}

