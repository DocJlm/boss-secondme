"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  }>;
}

interface EmployerPlazaClientProps {
  candidates: Candidate[];
  candidatesWithScores?: Array<{ candidate: Candidate; matchScore: number }>;
  employerProfile: EmployerProfile;
}

export function EmployerPlazaClient({
  candidates,
  candidatesWithScores = [],
  employerProfile,
}: EmployerPlazaClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
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
      // 按ID排序（近似按时间）
      filtered = filtered.sort((a, b) => b.id.localeCompare(a.id));
    }

    return filtered;
  }, [candidates, candidatesWithScores, searchQuery, selectedCity, selectedJobType, sortBy]);

  // 重置当前索引当筛选结果改变时
  if (currentIndex >= filteredAndSortedCandidates.length && filteredAndSortedCandidates.length > 0) {
    setCurrentIndex(0);
  }

  if (filteredAndSortedCandidates.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">
            {candidates.length === 0 ? "暂无候选人在线" : "没有找到匹配的候选人"}
          </p>
          {(searchQuery || selectedCity || selectedJobType) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCity("");
                setSelectedJobType("");
              }}
              className="text-orange-600 hover:text-orange-700 font-medium mb-4 block mx-auto"
            >
              清除筛选条件
            </button>
          )}
          <Link
            href="/"
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const currentCandidate = filteredAndSortedCandidates[currentIndex];
  const currentMatchScore = currentCandidate
    ? candidatesWithScores.find(
        (item) => item.candidate.id === currentCandidate.id
      )?.matchScore
    : undefined;

  const handleNext = () => {
    if (currentIndex < candidates.length - 1) {
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
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 transition-colors"
            title="退出登录"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600 font-medium">
                {currentIndex + 1} / {filteredAndSortedCandidates.length}
              </span>
              {filteredAndSortedCandidates.length > 0 && (
                <span className="text-xs text-slate-400">
                  ({candidates.length} 个候选人在线)
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
                placeholder="搜索候选人姓名、职位、技能..."
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
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm shadow-sm"
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
                  className="w-full px-3 py-2 rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm shadow-sm"
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
                最新注册
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

      {/* 卡片区域 */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 bg-gradient-to-b from-orange-50/30 via-white to-orange-50/30">
        <div className="relative w-full max-w-md">
          <CandidateCard
            candidate={currentCandidate}
            employerProfile={employerProfile}
            matchScore={currentMatchScore}
            onNext={handleNext}
            onPrev={handlePrev}
            canNext={currentIndex < filteredAndSortedCandidates.length - 1}
            canPrev={currentIndex > 0}
          />
        </div>
      </div>
      
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
          }}
          onClose={() => setShowEditDialog(false)}
          onSuccess={() => {
            // 刷新页面以显示更新后的数据
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
