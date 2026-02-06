"use client";

import Link from "next/link";

interface ConversationMessage {
  turn: number;
  role: "candidate" | "employer";
  content: string;
}

interface MatchDetailClientProps {
  conversation: {
    id: string;
    matchScore: number | null;
    matchThreshold: number;
    evaluationReason: string | null;
    // Prisma 中是 Json 字段，这里放宽类型，组件内部再做转换
    conversationHistory: unknown;
    job: {
      id: string;
      title: string;
      company: { name: string } | null;
    };
  };
}

export function MatchDetailClient({ conversation }: MatchDetailClientProps) {
  const history = (conversation.conversationHistory || []) as ConversationMessage[];
  const sortedHistory = [...history].sort((a, b) => a.turn - b.turn);

  return (
    <div className="space-y-6">
      {/* 匹配结果概览 */}
      <div className="rounded-xl border border-slate-200 p-6 bg-white">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">匹配结果</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-500 mb-1">匹配度分数</p>
            <p className="text-3xl font-bold text-blue-600">
              {conversation.matchScore !== null ? conversation.matchScore : "未评估"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-500 mb-1">匹配阈值</p>
            <p className="text-3xl font-bold text-slate-700">{conversation.matchThreshold}</p>
          </div>
        </div>
        {conversation.matchScore !== null && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  conversation.matchScore >= conversation.matchThreshold
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {conversation.matchScore >= conversation.matchThreshold ? "匹配成功" : "未达到阈值"}
              </span>
            </div>
            {conversation.evaluationReason && (
              <div className="mt-3 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-900 mb-2">评估理由：</p>
                <p className="text-sm text-slate-700">{conversation.evaluationReason}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 对话记录 */}
      <div className="rounded-xl border border-slate-200 p-6 bg-white">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          对话记录（共 {sortedHistory.length} 条消息）
        </h2>
        <div className="space-y-4">
          {sortedHistory.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">暂无对话记录</p>
          ) : (
            sortedHistory.map((msg, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  msg.role === "candidate"
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : "bg-purple-50 border-l-4 border-purple-500"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      msg.role === "candidate"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {msg.role === "candidate" ? "候选人" : "招聘方"}
                  </span>
                  <span className="text-xs text-slate-500">第 {msg.turn} 轮</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <Link
          href={`/jobs/${conversation.job.id}`}
          className="flex-1 text-center px-6 py-3 rounded-lg text-base font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          返回职位详情
        </Link>
        <Link
          href="/jobs/recommend"
          className="flex-1 text-center px-6 py-3 rounded-lg text-base font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
        >
          返回推荐列表
        </Link>
      </div>
    </div>
  );
}
