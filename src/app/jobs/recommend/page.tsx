import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { RecommendJobsClient } from "./RecommendJobsClient";

async function getRecommendations() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value ?? null;

  if (!sessionUserId) {
    return { loggedIn: false as const, jobs: [] };
  }

  // 调用推荐 API（这里直接调用内部逻辑，避免 HTTP 请求）
  // 为了简化，我们直接返回空数组，让客户端组件调用 API
  return { loggedIn: true as const, jobs: [] };
}

export default async function RecommendJobsPage() {
  const { loggedIn } = await getRecommendations();

  if (!loggedIn) {
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

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-50 font-sans py-12">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-lg border border-slate-200 px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              AI 职位推荐
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              基于你的个人资料，为你推荐最匹配的职位
            </p>
          </div>
          <Link
            href="/jobs"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            浏览全部职位 →
          </Link>
        </div>

        <RecommendJobsClient />
      </div>
    </main>
  );
}
