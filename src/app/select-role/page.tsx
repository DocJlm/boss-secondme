import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RoleSelectionClient } from "./RoleSelectionClient";

export default async function SelectRolePage() {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value ?? null;

  if (!sessionUserId) {
    redirect("/api/auth/login");
  }

  // 获取用户信息
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      candidateProfile: true,
      employerProfile: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/api/auth/login");
  }

  // 允许已有身份的用户重新选择身份，不再自动重定向

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-slate-200 px-8 py-10">
        <h1 className="text-2xl font-semibold text-slate-900 mb-2 text-center">
          选择你的身份
        </h1>
        <p className="text-slate-600 mb-8 text-center text-sm">
          请选择你希望使用的身份，之后可以在设置中切换
        </p>
        <RoleSelectionClient />
      </div>
    </div>
  );
}
