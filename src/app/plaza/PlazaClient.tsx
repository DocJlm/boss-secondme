"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { EmployerCard } from "./EmployerCard";
import { EditProfileDialog } from "./EditProfileDialog";

interface Employer {
  id: string;
  name: string | null;
  title: string | null;
  user: {
    id: string;
    secondmeUserId: string | null;
    avatar: string | null;
    name: string | null;
  };
  company: {
    id: string;
    name: string;
    city: string | null;
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
  }>;
}

interface CandidateProfile {
  id: string;
  userId: string;
  name: string | null;
  title: string | null;
  city: string | null;
  yearsExp: number | null;
  skills: string | null;
  bio: string | null;
}

interface RankingItem {
  rank: number;
  employer: Employer;
  conversationCount: number;
  matchScore: number;
}

interface JobWithScore {
  job: {
    id: string;
    title: string;
    description: string;
    city: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
  };
  matchScore: number;
}

interface PlazaClientProps {
  employers: Employer[];
  employersWithScores?: Array<{ employer: Employer; matchScore: number }>;
  jobsWithScoresMap?: Record<string, JobWithScore[]>;
  candidateProfile: CandidateProfile;
  candidateUserId: string;
  totalCount?: number;
  rankingList?: RankingItem[];
}

export function PlazaClient({
  employers,
  employersWithScores = [],
  jobsWithScoresMap,
  candidateProfile,
  candidateUserId,
  totalCount = 0,
  rankingList = [],
}: PlazaClientProps) {
  const [showEditDialog, setShowEditDialog] = useState(() => {
    const hasBasicInfo =
      candidateProfile?.title ||
      candidateProfile?.city ||
      candidateProfile?.skills ||
      candidateProfile?.bio;
    return !hasBasicInfo;
  });
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedJobType, setSelectedJobType] = useState<string>("");
  const [sortBy, setSortBy] = useState<"match" | "time">("match");
  const [showFilters, setShowFilters] = useState(false);
  
  // 跟踪每个招聘方选中的职位ID（key为employerId，value为jobId）
  const [selectedJobIds, setSelectedJobIds] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    if (jobsWithScoresMap) {
      Object.entries(jobsWithScoresMap).forEach(([employerId, jobsWithScores]) => {
        // 默认选择匹配度最高的职位（第一个，因为已按匹配度排序）
        if (jobsWithScores.length > 0) {
          map.set(employerId, jobsWithScores[0].job.id);
        }
      });
    }
    return map;
  });

  // 获取所有城市列表
  const allCities = useMemo(() => {
    const cities = new Set<string>();
    employers.forEach((employer) => {
      employer.jobs.forEach((job) => {
        if (job.city) cities.add(job.city);
      });
      if (employer.company?.city) cities.add(employer.company.city);
    });
    return Array.from(cities).sort();
  }, [employers]);

  // 筛选和排序逻辑
  const filteredAndSortedEmployers = useMemo(() => {
    let filtered = employers.filter((employer) => {
      // 搜索筛选
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesCompany = employer.company?.name?.toLowerCase().includes(query);
        const matchesName = employer.user.name?.toLowerCase().includes(query) || 
                           employer.name?.toLowerCase().includes(query);
        const matchesJob = employer.jobs.some((job) => 
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
        );
        if (!matchesCompany && !matchesName && !matchesJob) {
          return false;
        }
      }

      // 城市筛选
      if (selectedCity) {
        const hasCityJob = employer.jobs.some((job) => job.city === selectedCity);
        const companyCity = employer.company?.city === selectedCity;
        if (!hasCityJob && !companyCity) {
          return false;
        }
      }

      // 职位类型筛选（技术/非技术）
      if (selectedJobType) {
        const technicalKeywords = ["开发", "工程师", "程序员", "架构", "算法", "AI", "前端", "后端", "全栈", "Java", "Python", "React", "Vue", "Node", "Go", "Rust", "C++", "C#", "PHP", "Swift", "Kotlin", "Dart", "Flutter", "React Native"];
        const hasTechnicalJob = employer.jobs.some((job) => {
          const title = job.title.toLowerCase();
          const desc = job.description.toLowerCase();
          return technicalKeywords.some((keyword) => 
            title.includes(keyword.toLowerCase()) || desc.includes(keyword.toLowerCase())
          );
        });
        
        if (selectedJobType === "technical" && !hasTechnicalJob) {
          return false;
        }
        if (selectedJobType === "non-technical" && hasTechnicalJob) {
          return false;
        }
      }

      return true;
    });

    // 排序
    if (sortBy === "match") {
      filtered = filtered.sort((a, b) => {
        const scoreA = employersWithScores.find((item) => item.employer.id === a.id)?.matchScore || 0;
        const scoreB = employersWithScores.find((item) => item.employer.id === b.id)?.matchScore || 0;
        return scoreB - scoreA;
      });
    } else if (sortBy === "time") {
      filtered = filtered.sort((a, b) => {
        const latestJobA = a.jobs[0]?.id || "";
        const latestJobB = b.jobs[0]?.id || "";
        return latestJobB.localeCompare(latestJobA);
      });
    }

    return filtered;
  }, [employers, employersWithScores, searchQuery, selectedCity, selectedJobType, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setSelectedJobType("");
    setSortBy("match");
  };

  const hasActiveFilters = searchQuery || selectedCity || selectedJobType;

  const handleMatch = (employer: Employer, jobId: string) => {
    window.location.href = `/match/${candidateUserId}?jobId=${jobId}`;
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
              <span className="ml-2 text-orange-600">{totalCount || filteredAndSortedEmployers.length} 位用户</span>
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
              onClick={async () => {
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
              }}
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
                placeholder="搜索职位、公司名称..."
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
                  最新发布
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
          {filteredAndSortedEmployers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-slate-600 mb-4">
                  {employers.length === 0
                    ? "当前还没有招聘方发布职位，你可以先完善个人资料，稍后再来看看。"
                    : "没有找到匹配的招聘方，可以调整筛选条件或完善个人资料。"}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-orange-600 hover:text-orange-700 font-medium mb-4"
                  >
                    清除所有筛选
                  </button>
                )}
                <button
                  onClick={() => setShowEditDialog(true)}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  填写 / 编辑个人基本信息
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedEmployers.map((employer) => {
                // 获取该招聘方的职位匹配度信息
                const jobsWithScores = jobsWithScoresMap?.[employer.id] || [];
                // 获取选中的职位ID，如果没有则使用匹配度最高的职位
                const selectedJobId = selectedJobIds.get(employer.id) || (jobsWithScores.length > 0 ? jobsWithScores[0].job.id : null);
                // 找到选中的职位信息
                const selectedJobWithScore = jobsWithScores.find(jws => jws.job.id === selectedJobId);
                const selectedJob = selectedJobWithScore?.job;
                const selectedJobMatchScore = selectedJobWithScore?.matchScore;
                
                return (
                  <div
                    key={employer.id}
                    className="bg-white rounded-xl shadow-md border border-orange-100 hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="relative">
                      <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden">
                        {employer.user.avatar ? (
                          <Image
                            src={employer.user.avatar}
                            alt={employer.user.name || employer.company?.name || "招聘方"}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="text-6xl text-orange-600 font-medium">
                            {employer.user.name?.[0] || employer.company?.name?.[0] || "招"}
                          </span>
                        )}
                      </div>
                      {selectedJobMatchScore !== undefined && (
                        <div className="absolute top-2 right-2">
                          <div className="px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-md">
                            <span className="text-xs font-semibold text-white">
                              {selectedJobMatchScore}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 mb-1 truncate">
                        {employer.company?.name || "未知公司"}
                      </h3>
                      {(employer.user.name || employer.name) && (
                        <p className="text-sm text-slate-600 mb-2 truncate">
                          {employer.user.name || employer.name}
                        </p>
                      )}
                      {employer.company?.city && (
                        <p className="text-xs text-slate-500 mb-2">📍 {employer.company.city}</p>
                      )}
                      {selectedJob && (
                        <p className="text-xs text-slate-600 mb-2 line-clamp-1">
                          💼 {selectedJob.title}
                        </p>
                      )}
                      {/* 职位选择器：如果有多个职位，显示下拉选择器 */}
                      {jobsWithScores.length > 1 && (
                        <div className="mb-3">
                          <select
                            value={selectedJobId || ""}
                            onChange={(e) => {
                              const newSelectedJobIds = new Map(selectedJobIds);
                              newSelectedJobIds.set(employer.id, e.target.value);
                              setSelectedJobIds(newSelectedJobIds);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-xs shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {jobsWithScores.map((jws) => (
                              <option key={jws.job.id} value={jws.job.id}>
                                {jws.job.title} ({jws.matchScore}%)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          if (selectedJobId) {
                            handleMatch(employer, selectedJobId);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all"
                      >
                        开始匹配
                      </button>
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
                key={item.employer.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center overflow-hidden">
                  {item.employer.user.avatar ? (
                    <Image
                      src={item.employer.user.avatar}
                      alt={item.employer.user.name || item.employer.company?.name || "招聘方"}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-sm text-orange-600 font-medium">
                      {item.employer.user.name?.[0] || item.employer.company?.name?.[0] || "招"}
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
                      {item.employer.company?.name || item.employer.user.name || "招聘方"}
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
          role="candidate"
          initialData={candidateProfile}
          onClose={() => setShowEditDialog(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
