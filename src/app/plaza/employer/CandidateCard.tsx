"use client";

import { useState } from "react";
import Image from "next/image";

interface Candidate {
  id: string;
  name: string | null;
  title: string | null;
  city: string | null;
  yearsExp: number | null;
  skills: string | null;
  bio: string | null;
  user: {
    id: string;
    secondmeUserId: string | null;
    avatar: string | null;
    name: string | null;
  };
}

interface EmployerProfile {
  id: string;
  jobs: Array<{
    id: string;
    title: string;
    description?: string | null;
    city?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string | null;
  }>;
}

interface CandidateCardProps {
  candidate: Candidate;
  employerProfile: EmployerProfile;
  matchScore?: number;
  onNext: () => void;
  onPrev: () => void;
  canNext: boolean;
  canPrev: boolean;
}

export function CandidateCard({
  candidate,
  employerProfile,
  matchScore,
  onNext,
  onPrev,
  canNext,
  canPrev,
}: CandidateCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    employerProfile.jobs.length > 0 ? employerProfile.jobs[0].id : null
  );
  const [isJobsExpanded, setIsJobsExpanded] = useState(false);

  const handleMatch = async () => {
    // 启动匹配对话
    // 注意：匹配页面的 userId 参数应该是候选人（对方）的 ID
    if (selectedJobId) {
      // candidate.user.id 就是候选人的 ID，这是正确的
      window.location.href = `/match/${candidate.user.id}?jobId=${selectedJobId}`;
    }
  };

  return (
    <div className="relative w-full aspect-[3/4] max-w-sm mx-auto">
      {/* 卡片 */}
      <div
        className="absolute inset-0 bg-white rounded-2xl shadow-lg border border-orange-100 transition-all duration-300 hover:shadow-xl"
        style={{
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* 正面 */}
        <div
          className="absolute inset-0 rounded-2xl p-6 flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
            display: isFlipped ? "none" : "flex",
          }}
        >
          {/* 匹配度标签 */}
          {matchScore !== undefined && (
            <div className="absolute top-4 right-4">
              <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-md">
                <span className="text-sm font-semibold text-white">
                  匹配度 {matchScore}%
                </span>
              </div>
            </div>
          )}

          {/* 头像区域 */}
          <div className="flex-1 flex items-center justify-center mb-4">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FFE5EC] to-[#FFECD2] flex items-center justify-center overflow-hidden shadow-md ring-4 ring-orange-50">
              <Image
                src={candidate.user.avatar || "https://th.bing.com/th/id/OIP.Ao5SmjJyn7JTB6_iQjPkmgAAAA?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3"}
                alt={candidate.user.name || candidate.name || "候选人"}
                width={128}
                height={128}
                className="w-full h-full object-cover"
                unoptimized
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes("OIP.Ao5SmjJyn7JTB6_iQjPkmgAAAA")) {
                    target.src = "https://th.bing.com/th/id/OIP.Ao5SmjJyn7JTB6_iQjPkmgAAAA?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3";
                  }
                }}
              />
            </div>
          </div>

          {/* 信息区域 */}
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {candidate.user.name || candidate.name || "候选人"}
            </h2>
            {candidate.title && (
              <p className="text-slate-600 mb-1">{candidate.title}</p>
            )}
            {candidate.city && (
              <p className="text-sm text-slate-500 mt-2">📍 {candidate.city}</p>
            )}
            {candidate.yearsExp !== null && (
              <p className="text-sm text-slate-500">
                经验：{candidate.yearsExp} 年
              </p>
            )}
          </div>

          {/* 职位选择（如果招聘方有多个职位） */}
          {employerProfile.jobs.length > 1 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-700">选择职位：</p>
                <button
                  onClick={() => setIsJobsExpanded(!isJobsExpanded)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                >
                  {isJobsExpanded ? (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      收起
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      查看全部 ({employerProfile.jobs.length})
                    </>
                  )}
                </button>
              </div>
              {selectedJobId && (
                <div className="px-3 py-2 rounded-lg bg-orange-50 border-2 border-orange-500">
                  <p className="text-sm font-medium text-orange-900">
                    {employerProfile.jobs.find((j) => j.id === selectedJobId)?.title}
                  </p>
                  {employerProfile.jobs.find((j) => j.id === selectedJobId)?.city && (
                    <p className="text-xs text-orange-700 mt-1">
                      📍 {employerProfile.jobs.find((j) => j.id === selectedJobId)?.city}
                    </p>
                  )}
                </div>
              )}
              {isJobsExpanded && (
                <div className="space-y-2 pt-2 border-t border-slate-200 mt-2">
                  {employerProfile.jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setIsJobsExpanded(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedJobId === job.id
                          ? "bg-orange-100 border-2 border-orange-500 text-orange-900 shadow-sm"
                          : "bg-slate-50 border-2 border-transparent text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-medium">{job.title}</div>
                      {job.city && (
                        <div className="text-xs text-slate-500 mt-1">📍 {job.city}</div>
                      )}
                      {(job.salaryMin || job.salaryMax) && (
                        <div className="text-xs text-slate-500">
                          💰 {job.salaryMin || "面议"}
                          {job.salaryMax && job.salaryMin ? `-${job.salaryMax}` : ""} {job.salaryCurrency || "元"}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex gap-3 mt-auto">
            <button
              onClick={onPrev}
              disabled={!canPrev}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一个
            </button>
            <button
              onClick={() => setIsFlipped(true)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
            >
              查看详情
            </button>
            <button
              onClick={handleMatch}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              开始匹配
            </button>
            <button
              onClick={onNext}
              disabled={!canNext}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一个
            </button>
          </div>
        </div>

        {/* 背面 */}
        <div
          className="absolute inset-0 rounded-2xl p-6 flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            display: isFlipped ? "flex" : "none",
          }}
        >
          <div className="mb-4">
            <button
              onClick={() => setIsFlipped(false)}
              className="text-slate-600 hover:text-slate-900"
            >
              ← 返回
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {candidate.skills && (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">技能</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap mb-4">
                  {candidate.skills}
                </p>
              </>
            )}

            {candidate.bio && (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">个人简介</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {candidate.bio}
                </p>
              </>
            )}

            {!candidate.skills && !candidate.bio && (
              <p className="text-sm text-slate-500">暂无详细信息</p>
            )}

            {/* 职位选择（背面） */}
            {employerProfile.jobs.length > 1 && (
              <>
                <h3 className="text-lg font-semibold text-slate-900 mb-3 mt-6">选择职位</h3>
                <div className="space-y-2">
                  {employerProfile.jobs.map((job) => (
                    <div
                      key={job.id}
                      className={`p-3 rounded-lg border-2 ${
                        selectedJobId === job.id
                          ? "border-orange-500 bg-orange-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{job.title}</h4>
                        <button
                          onClick={() => setSelectedJobId(job.id)}
                          className={`px-3 py-1 text-xs rounded-lg ${
                            selectedJobId === job.id
                              ? "bg-orange-600 text-white"
                              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          }`}
                        >
                          {selectedJobId === job.id ? "已选择" : "选择"}
                        </button>
                      </div>
                      {job.city && (
                        <p className="text-xs text-slate-500 mb-1">📍 {job.city}</p>
                      )}
                      {(job.salaryMin || job.salaryMax) && (
                        <p className="text-xs text-slate-500 mb-2">
                          💰 {job.salaryMin || "面议"}
                          {job.salaryMax && job.salaryMin ? `-${job.salaryMax}` : ""} {job.salaryCurrency || "元"}
                        </p>
                      )}
                      <p className="text-sm text-slate-700 whitespace-pre-wrap line-clamp-2">
                        {job.description}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={handleMatch}
              className="w-full px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              开始匹配
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
