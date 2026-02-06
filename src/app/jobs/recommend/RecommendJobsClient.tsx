"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RecommendedJob {
  id: string;
  title: string;
  description: string;
  city: string | null;
  company: { name: string } | null;
  createdAt: Date;
  recommendationScore?: number;
  recommendationReason?: string;
  conversationId?: string | null;
}

export function RecommendJobsClient() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("正在初始化匹配...");

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setProgress("正在获取职位列表...");
        
        const response = await fetch("/api/jobs/recommend");
        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "获取推荐失败");
        }

        setProgress("匹配完成！");
        setJobs(result.data || []);
      } catch (err: any) {
        console.error("获取推荐失败:", err);
        setError(err.message || "获取推荐失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
        <p className="text-slate-500 text-sm">{progress}</p>
        <p className="text-xs text-slate-400 mt-2">
          AI 正在与招聘方进行多轮对话匹配，请稍候...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors shadow-md"
        >
          重试
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm mb-4">
          暂无推荐职位，请先完善个人资料或浏览全部职位
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center rounded-xl bg-orange-600 px-6 py-2 text-sm font-medium text-white hover:bg-orange-700 transition-colors shadow-lg"
        >
          浏览全部职位
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {jobs.map((job) => (
        <li
          key={job.id}
          className="rounded-2xl border border-slate-200 px-4 py-4 hover:border-orange-200 hover:shadow-md transition-all bg-white"
        >
          <div className="flex items-start justify-between mb-2">
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
            <div className="flex flex-col items-end gap-1 ml-4">
              {job.recommendationScore !== undefined && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                  匹配度 {job.recommendationScore}%
                </span>
              )}
              <span className="text-xs text-slate-400">
                {new Date(job.createdAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{job.description}</p>
          {job.recommendationReason && (
            <div className="mb-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
              <p className="text-xs font-medium text-orange-900 mb-1">匹配理由：</p>
              <p className="text-xs text-orange-700">{job.recommendationReason}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Link
              href={`/jobs/${job.id}`}
              className="flex-1 text-center px-4 py-2 rounded-xl text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-md"
            >
              查看详情
            </Link>
            <Link
              href={`/jobs/${job.id}/auto-match`}
              className="flex-1 text-center px-4 py-2 rounded-xl text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-md"
            >
              开始匹配
            </Link>
            {job.conversationId && (
              <Link
                href={`/jobs/${job.id}/match-detail?conversationId=${job.conversationId}`}
                className="flex-1 text-center px-4 py-2 rounded-xl text-sm font-medium bg-orange-400 text-white hover:bg-orange-500 transition-colors shadow-md"
              >
                查看对话
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
