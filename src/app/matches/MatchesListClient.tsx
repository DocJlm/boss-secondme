"use client";

import Link from "next/link";

interface Match {
  id: string;
  createdAt: Date;
  job: {
    id: string;
    title: string;
    description: string;
    city: string | null;
    company: { name: string } | null;
    createdAt: Date;
  };
}

interface MatchesListClientProps {
  initialMatches: Match[];
}

export function MatchesListClient({ initialMatches }: MatchesListClientProps) {
  if (initialMatches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm mb-4">
          你还没有点赞任何职位
        </p>
        <Link
          href="/jobs"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          去浏览职位
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {initialMatches.map((match) => (
        <li
          key={match.id}
          className="rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors bg-white"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <Link href={`/jobs/${match.job.id}`}>
                <h2 className="text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer">
                  {match.job.title}
                </h2>
              </Link>
              <p className="text-xs text-slate-500 mt-1">
                公司：{match.job.company?.name ?? "未填写公司"} · 城市：{match.job.city ?? "未填写"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 ml-4">
              <span className="text-xs text-slate-400">
                {new Date(match.job.createdAt).toLocaleDateString("zh-CN")}
              </span>
              <span className="text-xs text-blue-600">
                匹配于 {new Date(match.createdAt).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{match.job.description}</p>
          <div className="flex gap-2">
            <Link
              href={`/jobs/${match.job.id}`}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-center bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              查看详情
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
