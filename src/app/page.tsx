import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { HomeClient } from "./components/HomeClient";

export default async function Home() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value ?? null;

  let isLoggedIn = false;
  let secondmeUserId: string | null = null;
  let hasCandidateProfile = false;
  let hasEmployerProfile = false;

  if (sessionUserId) {
    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      include: {
        candidateProfile: true,
        employerProfile: true,
      },
    });
    if (user) {
      isLoggedIn = true;
      secondmeUserId = user.secondmeUserId;
      hasCandidateProfile = !!user.candidateProfile;
      hasEmployerProfile = !!user.employerProfile;
    }
  }

  // 如果已登录但没有身份，重定向到身份选择页面
  if (isLoggedIn && !hasCandidateProfile && !hasEmployerProfile) {
    redirect("/select-role");
  }

  // 如果已登录且有身份，重定向到相应的广场
  if (isLoggedIn) {
    if (hasCandidateProfile) {
      redirect("/plaza");
    }
    if (hasEmployerProfile) {
      redirect("/plaza/employer");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 font-sans">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg border border-slate-200 px-8 py-10">
        <h1 className="text-2xl font-semibold text-slate-900 mb-4">
          AI 版 Boss 直聘（SecondMe Demo）
        </h1>

        {isLoggedIn ? (
          <>
            <p className="text-slate-600 mb-4 leading-relaxed">
              已通过 SecondMe 登录。
              <br />
              SecondMe 用户 ID：{secondmeUserId}
            </p>
            <HomeClient
              hasCandidateProfile={hasCandidateProfile}
              hasEmployerProfile={hasEmployerProfile}
            />
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-6 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-900 transition-colors"
              >
                退出登录
              </button>
            </form>
            <p className="mt-4 text-xs text-slate-500">
              现在你可以以候选人身份浏览职位，或以招聘方身份管理职位。后续我们会在这些页面上接入 AI 匹配和 AI HR 聊天。
            </p>
          </>
        ) : (
          <>
            <p className="text-slate-600 mb-8 leading-relaxed">
              这是你的 AI 招聘应用的首页。第一步，我们先完成「使用 SecondMe 登录」
              能力，之后再在这里接入职位卡片、候选人匹配和 AI HR 聊天。
            </p>

            <a
              href="/api/auth/login"
              className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-orange-700 transition-colors"
            >
              使用 SecondMe 登录
            </a>

            <p className="mt-4 text-xs text-slate-500">
              点击后会跳转到 SecondMe 授权页面，登录并授权后会回到本站首页。
            </p>
          </>
        )}
      </div>
    </main>
  );
}


