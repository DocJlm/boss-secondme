"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface JobDetailClientProps {
  job: {
    id: string;
    title: string;
    description: string;
    city: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    tags: string | null;
    status: string;
    createdAt: Date;
    company: { name: string; city: string | null; website: string | null; intro: string | null } | null;
    employer: {
      name: string | null;
      title: string | null;
      user: { secondmeUserId: string } | null;
    } | null;
  };
  isOwner?: boolean;
}

export function JobDetailClient({ job, isOwner = false }: JobDetailClientProps) {
  const [loading, setLoading] = useState(false);
  const [matchStatus, setMatchStatus] = useState<"liked" | "passed" | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // 检查用户是否已对该职位进行操作
  useEffect(() => {
    const checkMatchStatus = async () => {
      try {
        const response = await fetch(`/api/match/status?jobId=${job.id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.code === 0 && result.data) {
            // 将数据库中的状态转换为组件使用的状态
            const status = result.data.status;
            if (status === "liked") {
              setMatchStatus("liked");
            } else if (status === "passed") {
              setMatchStatus("passed");
            }
          }
        } else if (response.status === 401) {
          // 用户未登录，不显示匹配状态
          setMatchStatus(null);
        }
      } catch (error) {
        console.error("检查匹配状态失败:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkMatchStatus();
  }, [job.id]);

  const handleAction = async (action: "like" | "pass") => {
    if (loading || matchStatus) return;
    setLoading(true);
    try {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId: job.id, action }),
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || "操作失败");
      }

      setMatchStatus(action === "like" ? "liked" : "passed");
    } catch (error: any) {
      console.error("操作失败:", error);
      alert(error.message || "操作失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = () => {
    if (!job.salaryMin && !job.salaryMax) return null;
    const currency = job.salaryCurrency === "USD" ? "$" : "¥";
    if (job.salaryMin && job.salaryMax) {
      return `${currency}${job.salaryMin.toLocaleString()} - ${currency}${job.salaryMax.toLocaleString()}`;
    }
    if (job.salaryMin) {
      return `${currency}${job.salaryMin.toLocaleString()}+`;
    }
    if (job.salaryMax) {
      return `最高 ${currency}${job.salaryMax.toLocaleString()}`;
    }
    return null;
  };

  const salaryText = formatSalary();

  return (
    <div className="space-y-6">
      {/* 职位标题和基本信息 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-4">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          {job.company && (
            <div className="flex items-center gap-2">
              <span className="font-medium">公司：</span>
              <span>{job.company.name}</span>
            </div>
          )}
          {job.city && (
            <div className="flex items-center gap-2">
              <span className="font-medium">城市：</span>
              <span>{job.city}</span>
            </div>
          )}
          {salaryText && (
            <div className="flex items-center gap-2">
              <span className="font-medium">薪资：</span>
              <span className="text-orange-600 font-semibold">{salaryText}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="font-medium">发布时间：</span>
            <span>{new Date(job.createdAt).toLocaleDateString("zh-CN")}</span>
          </div>
        </div>
      </div>

      {/* 标签 */}
      {job.tags && (
        <div>
          <div className="flex flex-wrap gap-2">
            {job.tags.split(",").map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 职位描述 */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">职位描述</h2>
        <div className="prose prose-slate max-w-none">
          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
            {job.description}
          </div>
        </div>
      </div>

      {/* 公司信息 */}
      {job.company && (
        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">公司信息</h2>
          <div className="space-y-2 text-slate-700">
            <div>
              <span className="font-medium">公司名称：</span>
              {job.company.name}
            </div>
            {job.company.city && (
              <div>
                <span className="font-medium">所在城市：</span>
                {job.company.city}
              </div>
            )}
            {job.company.website && (
              <div>
                <span className="font-medium">公司网站：</span>
                <a
                  href={job.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline"
                >
                  {job.company.website}
                </a>
              </div>
            )}
            {job.company.intro && (
              <div className="mt-3">
                <span className="font-medium">公司简介：</span>
                <p className="mt-1 text-slate-600 whitespace-pre-wrap">
                  {job.company.intro}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 招聘方信息 */}
      {job.employer && (
        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">招聘方信息</h2>
          <div className="space-y-2 text-slate-700">
            {job.employer.name && (
              <div>
                <span className="font-medium">联系人：</span>
                {job.employer.name}
              </div>
            )}
            {job.employer.title && (
              <div>
                <span className="font-medium">职位：</span>
                {job.employer.title}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="border-t border-slate-200 pt-6 space-y-4">
        {!isOwner && (
          <Link
            href={`/jobs/${job.id}/auto-match`}
            className="block w-full px-6 py-3 rounded-xl text-base font-medium text-center bg-orange-600 text-white hover:bg-orange-700 transition-colors shadow-lg"
          >
            开始自动匹配
          </Link>
        )}
        {isOwner ? (
          <div className="flex gap-4">
            <Link
              href={`/employer/jobs`}
              className="flex-1 px-6 py-3 rounded-lg text-base font-medium text-center bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              在管理页面编辑
            </Link>
          </div>
        ) : (
          <>
            {isChecking ? (
              <div className="text-sm text-slate-500">加载中...</div>
            ) : (
              <div className="flex gap-4">
                <button
                  onClick={() => handleAction("pass")}
                  disabled={loading || matchStatus === "passed"}
                  className={`flex-1 px-6 py-3 rounded-lg text-base font-medium transition-colors ${
                    matchStatus === "passed"
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                      : matchStatus === "liked"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {loading && matchStatus !== "passed" ? "处理中..." : matchStatus === "passed" ? "已略过" : "略过"}
                </button>
                <button
                  onClick={() => handleAction("like")}
                  disabled={loading || matchStatus === "liked"}
                  className={`flex-1 px-6 py-3 rounded-xl text-base font-medium transition-colors ${
                    matchStatus === "liked"
                      ? "bg-orange-600 text-white cursor-not-allowed"
                      : matchStatus === "passed"
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-orange-600 text-white hover:bg-orange-700 shadow-lg"
                  }`}
                >
                  {loading && matchStatus !== "liked" ? "处理中..." : matchStatus === "liked" ? "已点赞" : "点赞"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
