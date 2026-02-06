import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MatchDetailClient } from "./MatchDetailClient";

interface MatchDetailPageProps {
  params: Promise<{ id: string }> | { id: string };
  searchParams: Promise<{ conversationId?: string }> | { conversationId?: string };
}

export default async function MatchDetailPage({ params, searchParams }: MatchDetailPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const jobId = resolvedParams.id;
  const conversationId = resolvedSearchParams.conversationId;

  if (!conversationId) {
    notFound();
  }

  // 获取对话记录
  const conversation = await prisma.aIMatchConversation.findUnique({
    where: { id: conversationId },
    include: {
      user: {
        include: {
          candidateProfile: true,
        },
      },
      job: {
        include: {
          company: true,
        },
      },
    },
  });

  if (!conversation || conversation.jobId !== jobId) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">匹配详情</h1>
      <MatchDetailClient conversation={conversation} />
    </div>
  );
}
