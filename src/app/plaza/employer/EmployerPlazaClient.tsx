"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { CandidateCard } from "./CandidateCard";
import { EditProfileDialog } from "../EditProfileDialog";

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
  name: string | null;
  title: string | null;
  company: {
    id: string;
    name: string;
    city: string | null;
    website: string | null;
    intro: string | null;
  } | null;
  jobs: Array<{
    id: string;
    title: string;
    description: string;
    city: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    tags?: string | null;
    status?: string;
  }>;
}

interface RankingItem {
  rank: number;
  candidate: Candidate;
  conversationCount: number;
  matchScore: number;
}

interface EmployerPlazaClientProps {
  candidates: Candidate[];
  candidatesWithScores?: Array<{ candidate: Candidate; matchScore: number }>;
  employerProfile: EmployerProfile;
  totalCount?: number;
  rankingList?: RankingItem[];
}

export function EmployerPlazaClient({
  candidates,
  candidatesWithScores = [],
  employerProfile,
  totalCount = 0,
  rankingList = [],
}: EmployerPlazaClientProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedJobType, setSelectedJobType] = useState<string>("");
  const [sortBy, setSortBy] = useState<"match" | "time">("match");
  const [showFilters, setShowFilters] = useState(false);

  // 获取所有城市列表
  const allCities = useMemo(() => {
    const cities = new Set<string>();
    candidates.forEach((candidate) => {
      if (candidate.city) cities.add(candidate.city);
    });
    return Array.from(cities).sort();
  }, [candidates]);

  // 筛选和排序逻辑
  const filteredAndSortedCandidates = useMemo(() => {
    let filtered = candidates.filter((candidate) => {
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = candidate.user.name?.toLowerCase().includes(query) || 
                           candidate.name?.toLowerCase().includes(query);
        const matchesTitle = candidate.title?.toLowerCase().includes(query);
        const matchesSkills = candidate.skills?.toLowerCase().includes(query);
        const matchesBio = candidate.bio?.toLowerCase().includes(query);
        if (!matchesName && !matchesTitle && !matchesSkills && !matchesBio) {
          return false;
        }
      }

      // 城市筛选
      if (selectedCity && candidate.city !== selectedCity) {
        return false;
      }

      // 职位类型筛选（技术/非技术）
      if (selectedJobType) {
        const technicalKeywords = ["开发", "工程师", "程序员", "架构", "算法", "AI", "前端", "后端", "全栈", "Java", "Python", "React", "Vue", "Node", "Go", "Rust", "C++", "C#", "PHP", "Swift", "Kotlin", "Dart", "Flutter", "React Native"];
        const title = candidate.title?.toLowerCase() || "";
        const skills = candidate.skills?.toLowerCase() || "";
        const isTechnical = technicalKeywords.some((keyword) => 
          title.includes(keyword.toLowerCase()) || skills.includes(keyword.toLowerCase())
        );
        
        if (selectedJobType === "technical" && !isTechnical) {
          return false;
        }
        if (selectedJobType === "non-technical" && isTechnical) {
          return false;
        }
      }

      return true;
    });

    // 排序
    if (sortBy === "match") {
      filtered = filtered.sort((a, b) => {
        const scoreA = candidatesWithScores.find((item) => item.candidate.id === a.id)?.matchScore || 0;
        const scoreB = candidatesWithScores.find((item) => item.candidate.id === b.id)?.matchScore || 0;
        return scoreB - scoreA;
      });
    } else if (sortBy === "time") {
      filtered = filtered.sort((a, b) => b.id.localeCompare(a.id));
    }

    return filtered;
  }, [candidates, candidatesWithScores, searchQuery, selectedCity, selectedJobType, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setSelectedJobType("");
    setSortBy("match");
  };

  const hasActiveFilters = searchQuery || selectedCity || selectedJobType;

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (response.ok) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("退出登录失败:", error);
    }
  };

  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleMatch = (candidate: Candidate, jobId: string) => {
    window.location.href = `/match/${candidate.user.id}?jobId=${jobId}`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-orange-50/30 via-white to-orange-50/30">
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回首页
            </Link>
            <div className="text-sm text-slate-600">
              <span className="font-medium">探索 AI 伙伴</span>
              <span className="ml-2 text-orange-600">{totalCount || filteredAndSortedCandidates.length} 位用户</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-transparent transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              筛选
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setShowEditDialog(true)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              编辑资料
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 transition-colors"
              title="退出登录"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>

        {/* 筛选栏 */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-orange-100 bg-gradient-to-b from-orange-50/50 to-white animate-in slide-in-from-top duration-200">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="搜索候选人姓名、职位、技能..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm shadow-sm"
                >
                  <option value="">全部城市</option>
                  {allCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm shadow-sm"
                >
                  <option value="">全部类型</option>
                  <option value="technical">技术岗位</option>
                  <option value="non-technical">非技术岗位</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">排序：</span>
                <button
                  onClick={() => setSortBy("match")}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    sortBy === "match"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                      : "bg-slate-200 text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  匹配度
                </button>
                <button
                  onClick={() => setSortBy("time")}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    sortBy === "time"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                      : "bg-slate-200 text-slate-700 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  最新注册
                </button>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  清除所有筛选
                </button>
              )}
            </div>
          </div>
        )}

        {/* 卡片网格 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {filteredAndSortedCandidates.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-slate-600 mb-4">
                  {candidates.length === 0 ? "暂无候选人在线" : "没有找到匹配的候选人"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    清除筛选条件
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedCandidates.map((candidate) => {
                const matchScore = candidatesWithScores.find(
                  (item) => item.candidate.id === candidate.id
                )?.matchScore;
                const selectedJob = employerProfile.jobs[0];
                
                return (
                  <div
                    key={candidate.id}
                    className="bg-white rounded-xl shadow-md border border-orange-100 hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="relative">
                      <div className="aspect-square bg-gradient-to-br from-[#FFE5EC] to-[#FFECD2] flex items-center justify-center overflow-hidden">
                        {candidate.user.avatar ? (
                          <Image
                            src={candidate.user.avatar}
                            alt={candidate.user.name || candidate.name || "候选人"}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-6xl gradient-text font-bold">
                            {(candidate.user.name?.[0] || candidate.name?.[0] || "候").toUpperCase()}
                          </span>
                        )}
                      </div>
                      {matchScore !== undefined && (
                        <div className="absolute top-2 right-2">
                          <div className="px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-md">
                            <span className="text-xs font-semibold text-white">
                              {matchScore}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-1 truncate">
                        {candidate.user.name || candidate.name || "候选人"}
                      </h3>
                      {candidate.title && (
                        <p className="text-sm text-slate-600 mb-2 truncate">{candidate.title}</p>
                      )}
                      {candidate.city && (
                        <p className="text-xs text-slate-500 mb-2">📍 {candidate.city}</p>
                      )}
                      {candidate.bio && (
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {candidate.bio}
                        </p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile(candidate);
                          }}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all"
                        >
                          查看资料
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedJob) {
                              handleMatch(candidate, selectedJob.id);
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all"
                        >
                          开始匹配
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 右侧排行榜 */}
      {rankingList.length > 0 && (
        <div className="w-80 border-l border-orange-100 bg-white/95 backdrop-blur-sm overflow-y-auto">
          <div className="p-4 sticky top-0 bg-white border-b border-orange-100">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-slate-900">热门排行</h3>
            </div>
            <p className="text-xs text-slate-500">最受欢迎的 AI 伙伴</p>
          </div>
          <div className="p-4 space-y-3">
            {rankingList.map((item) => (
              <div
                key={item.candidate.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                onClick={() => handleViewProfile(item.candidate)}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#FFE5EC] to-[#FFECD2] flex items-center justify-center overflow-hidden">
                  {item.candidate.user.avatar ? (
                    <Image
                      src={item.candidate.user.avatar}
                      alt={item.candidate.user.name || item.candidate.name || "候选人"}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-sm gradient-text font-bold">
                      {(item.candidate.user.name?.[0] || item.candidate.name?.[0] || "候").toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.rank === 1 && (
                      <span className="text-yellow-500">👑</span>
                    )}
                    {item.rank === 2 && (
                      <span className="text-slate-400 font-bold">2</span>
                    )}
                    {item.rank === 3 && (
                      <span className="text-orange-600 font-bold">3</span>
                    )}
                    {item.rank > 3 && (
                      <span className="text-slate-400 text-xs font-medium">{item.rank}</span>
                    )}
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {item.candidate.user.name || item.candidate.name || "候选人"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {item.conversationCount} 次互动
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700">
                      热门
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {showEditDialog && (
        <EditProfileDialog
          role="employer"
          initialData={{
            name: employerProfile.name,
            title: employerProfile.title,
            companyName: employerProfile.company?.name,
            companyCity: employerProfile.company?.city || undefined,
            companyWebsite: employerProfile.company?.website || undefined,
            companyIntro: employerProfile.company?.intro || undefined,
            jobs: employerProfile.jobs.map(job => ({
              id: job.id,
              title: job.title,
              description: job.description,
              city: job.city,
              salaryMin: job.salaryMin,
              salaryMax: job.salaryMax,
              salaryCurrency: job.salaryCurrency,
              tags: job.tags || null,
              status: "open",
            })),
          }}
          onClose={() => setShowEditDialog(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {/* 查看候选人资料对话框 */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">候选人资料</h2>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* 头像和基本信息 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-24 h-24 rounded-full bg-gradient-to-br from-[#FFE5EC] to-[#FFECD2] flex items-center justify-center overflow-hidden">
                    {selectedCandidate.user.avatar ? (
                      <Image
                        src={selectedCandidate.user.avatar}
                        alt={selectedCandidate.user.name || selectedCandidate.name || "候选人"}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-4xl gradient-text font-bold">
                        {(selectedCandidate.user.name?.[0] || selectedCandidate.name?.[0] || "候").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {selectedCandidate.user.name || selectedCandidate.name || "候选人"}
                    </h3>
                    {selectedCandidate.title && (
                      <p className="text-sm text-slate-600 mb-2">{selectedCandidate.title}</p>
                    )}
                    {selectedCandidate.city && (
                      <p className="text-xs text-slate-500 mb-2">📍 {selectedCandidate.city}</p>
                    )}
                    {selectedCandidate.yearsExp !== null && (
                      <p className="text-xs text-slate-500">
                        工作经验：{selectedCandidate.yearsExp} 年
                      </p>
                    )}
                  </div>
                </div>

                {/* 个人简介 */}
                {selectedCandidate.bio && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">个人简介</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedCandidate.bio}
                    </p>
                  </div>
                )}

                {/* 技能 */}
                {selectedCandidate.skills && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">技能</h3>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {selectedCandidate.skills}
                    </p>
                  </div>
                )}

                {/* 匹配度信息 */}
                {candidatesWithScores.find(
                  (item) => item.candidate.id === selectedCandidate.id
                )?.matchScore !== undefined && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">匹配度</h3>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-2 rounded-lg bg-orange-100">
                        <span className="text-sm font-semibold text-orange-700">
                          {candidatesWithScores.find(
                            (item) => item.candidate.id === selectedCandidate.id
                          )?.matchScore || 0}%
                        </span>
                      </div>
                      <span className="text-sm text-slate-600">
                        基于您的职位要求计算
                      </span>
                    </div>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setSelectedCandidate(null)}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    关闭
                  </button>
                  {employerProfile.jobs.length > 0 && (
                    <button
                      onClick={() => {
                        const job = employerProfile.jobs[0];
                        setSelectedCandidate(null);
                        handleMatch(selectedCandidate, job.id);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all"
                    >
                      开始匹配
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
