import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * POST /api/match/[matchId]/unlock
 * 解锁匹配，允许查看对方完整信息
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> | { matchId: string } }
) {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value;

  if (!sessionUserId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const matchId = resolvedParams.matchId;

  try {
    // 查找匹配记录
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        user: true,
        job: {
          include: {
            employer: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "匹配记录不存在" }, { status: 404 });
    }

    // 检查权限：只有匹配的双方可以解锁
    const isCandidate = match.userId === sessionUserId;
    const isEmployer = match.job.employer.userId === sessionUserId;

    if (!isCandidate && !isEmployer) {
      return NextResponse.json({ error: "无权访问此匹配" }, { status: 403 });
    }

    // 检查匹配是否成功（评分 >= 阈值）
    const conversation = await prisma.aIMatchConversation.findUnique({
      where: {
        userId_jobId: {
          userId: match.userId,
          jobId: match.jobId,
        },
      },
    });

    if (!conversation || conversation.matchScore === null) {
      return NextResponse.json(
        { error: "匹配对话尚未完成或评分" },
        { status: 400 }
      );
    }

    if (conversation.matchScore < conversation.matchThreshold) {
      return NextResponse.json(
        { error: "匹配度未达到阈值，无法解锁" },
        { status: 400 }
      );
    }

    // 更新解锁状态
    await prisma.match.update({
      where: { id: matchId },
      data: { unlocked: true },
    });

    return NextResponse.json({ success: true, unlocked: true });
  } catch (error: any) {
    console.error("解锁匹配错误:", error);
    return NextResponse.json(
      { error: error.message || "解锁失败" },
      { status: 500 }
    );
  }
}
