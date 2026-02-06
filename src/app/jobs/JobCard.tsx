"use client";

import { useState } from "react";
import Link from "next/link";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    city: string | null;
    company: { name: string } | null;
    createdAt: Date;
  };
  onAction: (jobId: string, action: "like" | "pass") => Promise<void>;
}

export function JobCard({ job, onAction }: JobCardProps) {
  const [loading, setLoading] = useState(false);
  const [actioned, setActioned] = useState<"like" | "pass" | null>(null);

  const handleAction = async (action: "like" | "pass") => {
    if (loading || actioned) return;
    setLoading(true);
    try {
      await onAction(job.id, action);
      setActioned(action);
    } catch (error) {
      console.error("操作失败:", error);
      alert("操作失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="rounded-2xl border border-slate-200 px-4 py-4 hover:border-orange-200 hover:shadow-md transition-all bg-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1">
          <Link href={`/jobs/${job.id}`}>
            <h2 className="text-base font-semibold text-slate-900 hover:text-orange-600 transition-colors cursor-pointer">
              {job.title}
            </h2>
          </Link>
          <p className="text-xs text-slate-500 mt-1">
            公司：{job.company?.name ?? "未填写公司"} · 城市：{job.city ?? "未填写"}
          </p>
        </div>
        <span className="text-xs text-slate-400 ml-4">
          {job.createdAt.toLocaleDateString("zh-CN")}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{job.description}</p>
      <div className="flex gap-2">
        <button
          onClick={() => handleAction("pass")}
          disabled={loading || actioned === "pass"}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            actioned === "pass"
              ? "bg-slate-200 text-slate-500 cursor-not-allowed"
              : actioned === "like"
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          {loading && actioned !== "pass" ? "处理中..." : actioned === "pass" ? "已略过" : "略过"}
        </button>
        <button
          onClick={() => handleAction("like")}
          disabled={loading || actioned === "like"}
          className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            actioned === "like"
              ? "bg-orange-600 text-white cursor-not-allowed"
              : actioned === "pass"
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-orange-600 text-white hover:bg-orange-700 shadow-md"
          }`}
        >
          {loading && actioned !== "like" ? "处理中..." : actioned === "like" ? "已点赞" : "点赞"}
        </button>
      </div>
    </li>
  );
}
