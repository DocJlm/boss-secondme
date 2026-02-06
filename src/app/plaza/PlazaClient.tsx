"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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

interface PlazaClientProps {
  employers: Employer[];
  employersWithScores?: Array<{ employer: Employer; matchScore: number }>;
  candidateProfile: CandidateProfile;
  candidateUserId: string;
}

export function PlazaClient({
  employers,
  employersWithScores = [],
  candidateProfile,
  candidateUserId,
}: PlazaClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(() => {
    const hasBasicInfo =
      candidateProfile?.title ||
      candidateProfile?.city ||
      candidateProfile?.skills ||
      candidateProfile?.bio;
    // 如果还没有填写任何基础信息，首次进入时自动弹出编辑资料
    return !hasBasicInfo;
  });
  
  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedJobType, setSelectedJobType] = useState<string>("");
  const [sortBy, setSortBy] = useState<"match" | "time">("match");
  const [showFilters, setShowFilters] = useState(false);

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

  // 重置当前索引当筛选结果改变时
  if (currentIndex >= filteredAndSortedEmployers.length && filteredAndSortedEmployers.length > 0) {
    setCurrentIndex(0);
  }

  const isEmpty = filteredAndSortedEmployers.length === 0;

  const currentEmployer = filteredAndSortedEmployers[currentIndex];
  const currentMatchScore = currentEmployer
    ? employersWithScores.find((item) => item.employer.id === currentEmployer.id)
        ?.matchScore
    : undefined;

  const handleNext = () => {
    if (currentIndex < employers.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCity("");
    setSelectedJobType("");
    setSortBy("match");
  };

  const hasActiveFilters = searchQuery || selectedCity || selectedJobType;

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">
                {currentIndex + 1} / {filteredAndSortedEmployers.length}
              </span>
              {filteredAndSortedEmployers.length > 0 && (
                <span className="text-xs text-slate-400">
                  ({employers.length} 个招聘方在线)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-orange-100 bg-gradient-to-b from-orange-50/50 to-white animate-in slide-in-from-top duration-200">
          <div className="space-y-3">
            {/* 搜索框 */}
            <div>
              <input
                type="text"
                placeholder="搜索职位、公司名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
              />
            </div>

            {/* 筛选条件 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 城市筛选 */}
              <div>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  <option value="">全部城市</option>
                  {allCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* 职位类型筛选 */}
              <div>
                <select
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                >
                  <option value="">全部类型</option>
                  <option value="technical">技术岗位</option>
                  <option value="non-technical">非技术岗位</option>
                </select>
              </div>
            </div>

            {/* 排序 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">排序：</span>
              <button
                onClick={() => setSortBy("match")}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  sortBy === "match"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                    : "bg-slate-200 text-slate-700 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-transparent"
                }`}
              >
                匹配度
              </button>
              <button
                onClick={() => setSortBy("time")}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                  sortBy === "time"
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                    : "bg-slate-200 text-slate-700 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-transparent"
                }`}
              >
                最新发布
              </button>
            </div>

            {/* 清除筛选 */}
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

      {/* 内容区域 / 卡片区域 */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 bg-gradient-to-b from-orange-50/30 via-white to-orange-50/30">
        {isEmpty ? (
          <div className="text-center max-w-md">
            <p className="text-slate-600 mb-4">
              {employers.length === 0
                ? "当前还没有招聘方发布职位，你可以先完善个人资料，稍后再来看看。"
                : "没有找到匹配的招聘方，可以调整筛选条件或完善个人资料。"}
            </p>
            {(searchQuery || selectedCity || selectedJobType) && (
              <button
                onClick={clearFilters}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium mb-4"
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
        ) : (
          <div className="relative w-full max-w-md">
            <EmployerCard
              employer={currentEmployer}
              candidateProfile={candidateProfile}
              candidateUserId={candidateUserId}
              matchScore={currentMatchScore}
              onNext={handleNext}
              onPrev={handlePrev}
              canNext={currentIndex < filteredAndSortedEmployers.length - 1}
              canPrev={currentIndex > 0}
            />
          </div>
        )}
      </div>

      {showEditDialog && (
        <EditProfileDialog
          role="candidate"
          initialData={candidateProfile}
          onClose={() => setShowEditDialog(false)}
          onSuccess={() => {
            // 编辑成功后刷新页面以获取最新资料和匹配结果
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
