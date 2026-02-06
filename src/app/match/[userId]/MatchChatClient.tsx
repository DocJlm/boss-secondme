"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { RealtimeUserInfo } from "@/app/components/RealtimeUserInfo";

interface Message {
  turn: number;
  role: "candidate" | "employer";
  content: string;
}

interface MatchChatClientProps {
  candidateProfile: {
    name: string | null;
    title: string | null;
  };
  candidateAvatar?: string | null;
  candidateName?: string | null;
  job: {
    id: string;
    title: string;
    company: {
      name: string;
    } | null;
  };
  employerAvatar?: string | null;
  employerName?: string | null;
  conversationId: string;
  matchId?: string;
  isCandidate: boolean;
  candidateUserId?: string;
  employerUserId?: string;
  initialMessages?: Message[];
  initialMatchScore?: number | null;
  isCompleted?: boolean;
}

export function MatchChatClient({
  candidateProfile,
  candidateAvatar,
  candidateName,
  job,
  employerAvatar,
  employerName,
  conversationId,
  matchId,
  isCandidate,
  candidateUserId,
  employerUserId,
  initialMessages = [],
  initialMatchScore = null,
  isCompleted: initialIsCompleted = false,
}: MatchChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [progress, setProgress] = useState(
    initialMessages.length > 0 ? (initialMessages[initialMessages.length - 1]?.turn || 0) / 5 * 100 : 0
  );
  const [matchScore, setMatchScore] = useState<number | null>(initialMatchScore);
  const [isCompleted, setIsCompleted] = useState(initialIsCompleted);
  const [isLoading, setIsLoading] = useState(!initialIsCompleted && initialMessages.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  const [realtimeCandidateAvatar, setRealtimeCandidateAvatar] = useState<string | null>(candidateAvatar || null);
  const [realtimeCandidateName, setRealtimeCandidateName] = useState<string | null>(candidateName || null);
  const [realtimeEmployerAvatar, setRealtimeEmployerAvatar] = useState<string | null>(employerAvatar || null);
  const [realtimeEmployerName, setRealtimeEmployerName] = useState<string | null>(employerName || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUnlock = async () => {
    if (!matchId) return;
    setIsUnlocking(true);
    try {
      const response = await fetch(`/api/match/${matchId}/unlock`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUnlocked(true);
      } else {
        alert(data.error || "解锁失败");
      }
    } catch (error) {
      console.error("解锁错误:", error);
      alert("解锁失败");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleAddFriend = async () => {
    if (!candidateUserId || !employerUserId) return;
    const friendId = isCandidate ? employerUserId : candidateUserId;
    setIsAddingFriend(true);
    try {
      const response = await fetch("/api/friends/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsFriend(true);
      } else {
        alert(data.error || "添加好友失败");
      }
    } catch (error) {
      console.error("添加好友错误:", error);
      alert("添加好友失败");
    } finally {
      setIsAddingFriend(false);
    }
  };

  useEffect(() => {
    // 如果已有历史记录且已完成，不需要重新启动
    if (initialIsCompleted && initialMessages.length > 0) {
      setIsLoading(false);
      return;
    }
    
    // 如果有历史记录但未完成，继续对话
    if (initialMessages.length > 0 && !initialIsCompleted) {
      // 继续对话逻辑
      continueConversation();
      return;
    }
    
    // 启动自动对话
    const startAutoMatch = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/ai-match/conversations/${conversationId}/auto`);

        if (!response.ok) {
          throw new Error("启动自动匹配失败");
        }

        if (!response.body) {
          throw new Error("无法获取流式响应");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data && data !== "[DONE]") {
                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === "message") {
                    setMessages((prev) => [...prev, parsed.message]);
                    const newProgress = (parsed.message.turn / 5) * 100;
                    setProgress(newProgress);
                  } else if (parsed.type === "progress") {
                    setProgress(parsed.progress);
                  } else if (parsed.type === "score") {
                    setMatchScore(parsed.score);
                    setIsCompleted(true);
                    setIsLoading(false);
                  } else if (parsed.type === "error") {
                    setError(parsed.message);
                    setIsLoading(false);
                  }
                } catch (e) {
                  console.error("解析消息失败:", e, data);
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error("自动匹配失败:", err);
        setError(err.message || "自动匹配失败，请稍后重试");
        setIsLoading(false);
      }
    };

    startAutoMatch();
  }, [conversationId, initialIsCompleted, initialMessages.length]);
  
  // 继续对话的函数
  const continueConversation = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/ai-match/conversations/${conversationId}/auto`);

      if (!response.ok) {
        throw new Error("继续对话失败");
      }

      if (!response.body) {
        throw new Error("无法获取流式响应");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data && data !== "[DONE]") {
              try {
                const parsed = JSON.parse(data);

                if (parsed.type === "message") {
                  setMessages((prev) => {
                    // 避免重复添加消息
                    const exists = prev.some(m => m.turn === parsed.message.turn && m.role === parsed.message.role);
                    if (exists) return prev;
                    return [...prev, parsed.message];
                  });
                  const newProgress = (parsed.message.turn / 5) * 100;
                  setProgress(newProgress);
                } else if (parsed.type === "progress") {
                  setProgress(parsed.progress);
                } else if (parsed.type === "score") {
                  setMatchScore(parsed.score);
                  setIsCompleted(true);
                  setIsLoading(false);
                } else if (parsed.type === "error") {
                  setError(parsed.message);
                  setIsLoading(false);
                }
              } catch (e) {
                console.error("解析消息失败:", e, data);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("继续对话失败:", err);
      setError(err.message || "继续对话失败，请稍后重试");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full bg-white">
      {/* 实时获取候选人信息 */}
      {candidateUserId && (
        <RealtimeUserInfo
          targetUserId={candidateUserId}
          initialAvatar={candidateAvatar}
          initialName={candidateName}
          onUpdate={(info) => {
            setRealtimeCandidateAvatar(info.avatar);
            setRealtimeCandidateName(info.name);
          }}
        />
      )}
      {/* 实时获取招聘方信息 */}
      {employerUserId && (
        <RealtimeUserInfo
          targetUserId={employerUserId}
          initialAvatar={employerAvatar}
          initialName={employerName}
          onUpdate={(info) => {
            setRealtimeEmployerAvatar(info.avatar);
            setRealtimeEmployerName(info.name);
          }}
        />
      )}
      {/* 头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <Link
          href={isCandidate ? "/plaza" : "/plaza/employer"}
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
          返回广场
        </Link>
        <div className="flex items-center gap-4">
          {!isCompleted && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-700 min-w-[3rem] text-right">
                {Math.round(progress)}%
              </span>
            </div>
          )}
          {isCompleted && matchScore !== null && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-orange-600">匹配度: {matchScore}%</span>
            </div>
          )}
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50">
        {error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-lg"
            >
              重试
            </button>
          </div>
        ) : messages.length === 0 && isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-slate-600">正在启动自动匹配...</p>
          </div>
        ) : messages.length === 0 && !isLoading && !error && !initialIsCompleted ? (
          <div className="text-center py-12">
            <p className="text-slate-600 mb-4">暂无对话记录</p>
            <button
              onClick={continueConversation}
              className="px-6 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-lg"
            >
              开始匹配
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === "candidate" ? "justify-start" : "justify-end"
                }`}
              >
                {message.role === "candidate" && (
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {realtimeCandidateAvatar ? (
                      <Image
                        src={realtimeCandidateAvatar}
                        alt={realtimeCandidateName || "候选人"}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-orange-600 font-medium text-sm">
                        {realtimeCandidateName?.[0] || "候"}
                      </span>
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === "candidate"
                      ? "bg-white border border-slate-200 rounded-tl-sm"
                      : "bg-orange-50 border border-orange-200 rounded-tr-sm"
                  }`}
                >
                  <div className="text-sm text-slate-900 prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mb-1 mt-2" {...props} />,
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                        li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-slate-100 px-1 py-0.5 rounded text-xs" {...props} />,
                        pre: ({ node, ...props }) => <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto mb-2" {...props} />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
                {message.role === "employer" && (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {realtimeEmployerAvatar ? (
                      <Image
                        src={realtimeEmployerAvatar}
                        alt={realtimeEmployerName || "招聘方"}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-blue-600 font-medium text-sm">
                        {realtimeEmployerName?.[0] || "HR"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-medium text-sm">HR</span>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 底部操作区 */}
      {isCompleted && (
        <div className="border-t border-slate-200 bg-white px-6 py-6">
          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-slate-900 mb-2">对话完成！</p>
            {matchScore !== null && (
              <p className="text-sm text-slate-600">
                匹配度: <span className="font-bold text-orange-600">{matchScore}%</span>
              </p>
            )}
          </div>
          <div className="space-y-3">
            {!isCompleted && messages.length > 0 && (
              <button
                onClick={continueConversation}
                disabled={isLoading}
                className="w-full px-6 py-4 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "继续对话中..." : "继续对话"}
              </button>
            )}
            {matchScore !== null && matchScore >= 60 && matchId && (
              <>
                {!unlocked && (
                  <button
                    onClick={handleUnlock}
                    disabled={isUnlocking}
                    className="w-full px-6 py-4 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUnlocking ? "解锁中..." : "解锁对方信息"}
                  </button>
                )}
                {unlocked && !isFriend && candidateUserId && employerUserId && (
                  <button
                    onClick={handleAddFriend}
                    disabled={isAddingFriend}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingFriend ? "添加中..." : "添加好友"}
                  </button>
                )}
                {isFriend && (
                  <div className="w-full px-6 py-4 bg-green-100 text-green-700 rounded-xl font-medium text-center">
                    已是好友
                  </div>
                )}
              </>
            )}
            {matchScore !== null && matchScore < 60 && (
              <div className="w-full px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-medium text-center">
                匹配度未达到阈值
              </div>
            )}
            <Link
              href={isCandidate ? "/plaza" : "/plaza/employer"}
              className="block w-full text-center px-6 py-4 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              返回广场
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
