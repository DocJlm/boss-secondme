"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RoleSelectionClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSelectRole = async (role: "candidate" | "employer") => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/select-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || "选择身份失败");
      }

      // 重定向到相应的广场页面
      if (role === "candidate") {
        router.push("/plaza");
      } else {
        router.push("/plaza/employer");
      }
    } catch (err: any) {
      console.error("选择身份失败:", err);
      setError(err.message || "选择身份失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={() => handleSelectRole("candidate")}
        disabled={loading}
        className="w-full px-6 py-4 rounded-xl text-base font-medium text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "处理中..." : "我是候选人"}
      </button>

      <button
        onClick={() => handleSelectRole("employer")}
        disabled={loading}
        className="w-full px-6 py-4 rounded-xl text-base font-medium text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "处理中..." : "我是招聘方"}
      </button>

      <p className="text-xs text-slate-500 text-center mt-4">
        选择后，你将进入相应的广场浏览职位或候选人
      </p>
    </div>
  );
}
