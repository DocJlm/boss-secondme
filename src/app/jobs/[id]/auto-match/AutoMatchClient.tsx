"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Message {
  turn: number;
  role: "candidate" | "employer";
  content: string;
}

interface AutoMatchClientProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  conversationId: string;
  candidateProfile: {
    name: string | null;
    title: string | null;
  };
}

export function AutoMatchClient({
  jobId,
  jobTitle,
  companyName,
  conversationId,
  candidateProfile,
}: AutoMatchClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState(0);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 启动自动对话
    const startAutoMatch = async () => {
      try {
        setIsLoading(true);
        
        // 使用 fetch 接收 SSE 流式响应
        const response = await fetch(`/api/ai-match/conversations/${conversationId}/auto`);

        if (!response.ok) {
          throw new Error("启动自动匹配失败");
        }

        if (!response.body) {
          throw new Error("无法获取流式响应");
        }

        // 手动读取 SSE 流
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
          buffer = lines.pop() || ""; // 保留不完整的行

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data && data !== "[DONE]") {
                try {
                  const parsed = JSON.parse(data);

                  if (parsed.type === "message") {
                    setMessages((prev) => [...prev, parsed.message]);
                    // 更新进度
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
  }, [conversationId]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto w-full bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <Link
          href={`/jobs/${jobId}`}
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
          返回职位详情
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
              className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              重试
            </button>
          </div>
        ) : messages.length === 0 && isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
            <p className="text-slate-600">正在启动自动匹配...</p>
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
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-medium text-sm">
                      {candidateProfile.name?.[0] || "候"}
                    </span>
                  </div>
                )}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === "candidate"
                      ? "bg-white border border-slate-200 rounded-tl-sm"
                      : "bg-orange-50 border border-orange-200 rounded-tr-sm"
                  }`}
                >
                  <p className="text-sm text-slate-900 whitespace-pre-wrap">{message.content}</p>
                </div>
                {message.role === "employer" && (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-medium text-sm">HR</span>
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
          <Link
            href={`/jobs/${jobId}/match-detail?conversationId=${conversationId}`}
            className="block w-full text-center px-6 py-4 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors shadow-lg"
          >
            查看匹配结果
          </Link>
        </div>
      )}
    </div>
  );
}
