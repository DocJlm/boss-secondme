"use client";

import Link from "next/link";

interface MatchResultCardProps {
  matchScore: number;
  evaluationReason: string | null;
  isCandidate: boolean;
  candidateName: string | null;
  employerName: string | null;
  candidateSecondMeUserId: string | null;
  employerSecondMeUserId: string | null;
  candidateRoute?: string | null;
  employerRoute?: string | null;
  onClose: () => void;
  onContinueChat: () => void;
}

// 心形图标
function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

// Spark 图标
function SparkIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" />
    </svg>
  );
}

// Build SecondMe profile URL based on current domain
function buildSecondMeUrl(route: string): string {
  if (typeof window === 'undefined') return '';

  const hostname = window.location.hostname;
  // 根据当前域名选择对应的 SecondMe 域名
  let secondMeDomain = 'https://second-me.cn';
  if (hostname.includes('second.me') || hostname.includes('localhost')) {
    // 如果是 second.me 域名或本地开发，使用 second.me
    secondMeDomain = 'https://second.me';
  }

  // route 可能是 "/littlecool" 或 "littlecool"，统一处理
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `${secondMeDomain}${cleanRoute}`;
}

export function MatchResultCard({
  matchScore,
  evaluationReason,
  isCandidate,
  candidateName,
  employerName,
  candidateRoute,
  employerRoute,
  onClose,
  onContinueChat,
}: MatchResultCardProps) {
  const getScoreEmoji = () => {
    if (matchScore >= 90) return "💕";
    if (matchScore >= 70) return "💖";
    if (matchScore >= 60) return "😊";
    if (matchScore >= 40) return "🤝";
    return "👋";
  };

  const getScoreText = () => {
    if (matchScore >= 90) return "完美匹配！";
    if (matchScore >= 70) return "非常合拍！";
    if (matchScore >= 60) return "有潜力的搭配~";
    if (matchScore >= 40) return "可以继续了解";
    return "也许下次会更好";
  };

  const getScoreColor = () => {
    if (matchScore >= 70) return "from-green-400 to-emerald-500";
    if (matchScore >= 60) return "from-[#FF6B6B] to-[#FF8E53]";
    return "from-[#FFD93D] to-[#FFA726]";
  };

  // 构建 SecondMe 真实主页链接（使用 route）
  const targetRoute = isCandidate ? employerRoute : candidateRoute;
  const secondMeProfileUrl = targetRoute ? buildSecondMeUrl(targetRoute) : null;

  // 解析匹配原因，提取亮点
  const highlights = evaluationReason
    ? evaluationReason
        .split(/[，,。.]/)
        .filter((r) => r.trim().length > 0)
        .slice(0, 4)
    : [];

  // 根据角色生成评价文本
  // 注意：isCandidate=true 表示当前用户是应聘方，应该显示对招聘方的评价
  // isCandidate=false 表示当前用户是招聘方，应该显示对应聘方的评价
  const getEvaluationText = () => {
    if (evaluationReason) {
      // evaluationReason 应该已经是对对方的评价
      return evaluationReason;
    }
    // 如果没有评价原因，生成默认评价
    if (isCandidate) {
      // 应聘方看到的是对招聘方的评价
      return `这位${employerName || "招聘方"}在职位要求、团队文化和职业发展方面与您的背景高度匹配，对话中展现出强烈的合作意愿和良好的沟通能力。`;
    } else {
      // 招聘方看到的是对应聘方的评价
      return `这位${candidateName || "候选人"}在技能水平、工作经验和职业规划方面与您的职位需求高度契合，对话中展现出积极的工作态度和良好的专业素养。`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#FFE5EC] transition-colors group"
          title="关闭"
        >
          <svg
            className="w-5 h-5 text-[#9A8A84] group-hover:text-[#FF6B6B]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          {/* 心形图标 */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <HeartIcon className="w-16 h-16 text-pink-500" />
              <div className="absolute -top-1 -right-1 text-2xl animate-pulse">{getScoreEmoji()}</div>
            </div>
          </div>

          {/* 标题 */}
          <h3 className="text-2xl font-bold text-[#2D1B14] mb-1">匹配结果</h3>
          <p className="text-sm text-[#9A8A84] mb-6">
            {isCandidate
              ? `${candidateName || "候选人"} & ${employerName || "招聘方"}`
              : `${employerName || "招聘方"} & ${candidateName || "候选人"}`}
          </p>

          {/* 分数 */}
          <div className="mb-6">
            <div
              className={`inline-block text-6xl font-bold bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}
            >
              {matchScore}
            </div>
            <div className="text-lg font-semibold text-[#2D1B14] mt-1">{getScoreText()}</div>
          </div>

          {/* 评价文本 */}
          <p className="text-[#6B5750] mb-4 px-4 text-sm leading-relaxed">{getEvaluationText()}</p>

          {/* 亮点标签 */}
          {highlights.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap justify-center gap-2">
                {highlights.map((highlight, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-full text-sm bg-[#FFE5EC] text-[#FF6B6B]"
                  >
                    {highlight.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 解锁状态 - 匹配成功显示链接 */}
          {matchScore >= 60 && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-green-600">
                  <SparkIcon className="w-5 h-5" />
                  <span className="font-semibold text-sm">
                    {isCandidate ? "恭喜！已解锁招聘方的主页" : "恭喜！已解锁候选人的主页"}
                  </span>
                </div>
                {secondMeProfileUrl && (
                  <a
                    href={secondMeProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-700 underline underline-offset-2 font-medium transition-colors text-sm"
                  >
                    {secondMeProfileUrl.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3">
            <Link
              href={isCandidate ? "/plaza" : "/plaza/employer"}
              className="flex-1 py-3 rounded-xl border-2 border-[#FFE5EC] text-[#FF6B6B] font-semibold hover:bg-[#FFE5EC] transition-all text-center"
            >
              返回首页
            </Link>
            <button
              onClick={() => {
                onClose();
                onContinueChat();
              }}
              className="flex-1 py-3 rounded-xl gradient-bg text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              继续聊天
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
