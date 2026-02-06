import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

/**
 * POST /api/friends/add
 * 添加好友
 * Body: { friendId: string }
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionUserId = cookieStore.get("session_user_id")?.value;

  if (!sessionUserId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { friendId } = body;

    if (!friendId) {
      return NextResponse.json({ error: "缺少 friendId" }, { status: 400 });
    }

    if (sessionUserId === friendId) {
      return NextResponse.json({ error: "不能添加自己为好友" }, { status: 400 });
    }

    // 检查是否已经是好友
    const existingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: sessionUserId, friendId: friendId },
          { userId: friendId, friendId: sessionUserId },
        ],
      },
    });

    if (existingFriend) {
      if (existingFriend.status === "accepted") {
        return NextResponse.json({ error: "已经是好友" }, { status: 400 });
      }
      if (existingFriend.status === "blocked") {
        return NextResponse.json({ error: "该用户已被屏蔽" }, { status: 400 });
      }
      // 如果之前是 pending，更新为 accepted
      await prisma.friend.update({
        where: { id: existingFriend.id },
        data: { status: "accepted" },
      });
      return NextResponse.json({ success: true, status: "accepted" });
    }

    // 检查是否有匹配记录且已解锁
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { userId: sessionUserId, job: { employer: { userId: friendId } } },
          { userId: friendId, job: { employer: { userId: sessionUserId } } },
        ],
        unlocked: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "需要先匹配成功并解锁才能添加好友" },
        { status: 400 }
      );
    }

    // 创建好友关系
    const friend = await prisma.friend.create({
      data: {
        userId: sessionUserId,
        friendId: friendId,
        status: "accepted", // 匹配成功后直接成为好友
      },
    });

    return NextResponse.json({ success: true, friend });
  } catch (error: any) {
    console.error("添加好友错误:", error);
    return NextResponse.json(
      { error: error.message || "添加好友失败" },
      { status: 500 }
    );
  }
}
