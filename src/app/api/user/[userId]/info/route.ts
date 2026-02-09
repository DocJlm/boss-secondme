import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, getUserInfo } from "@/lib/secondme";

/**
 * GET /api/user/[userId]/info
 *
 * 根据userId获取指定用户的 SecondMe 信息（包括头像、姓名等）
 * 这个API会实时调用 SecondMe API，确保数据是最新的
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  if (!userId) {
    return NextResponse.json({ code: 400, message: "缺少userId参数" }, { status: 400 });
  }

  try {
    // 从数据库获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        secondmeUserId: true,
        avatar: true,
        name: true,
        accessToken: true,
        tokenExpiresAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { code: 404, message: "用户不存在" },
        { status: 404 }
      );
    }

    // 尝试获取有效的 accessToken 并实时获取 SecondMe 信息
    try {
      const accessToken = await getValidAccessToken(user.id);
      if (accessToken) {
        // 实时调用 SecondMe API 获取用户信息
        const userInfoResponse = await getUserInfo(accessToken);

        // getUserInfo 返回的是 API 响应对象，包含 code 和 data
        if (userInfoResponse && userInfoResponse.code === 0 && userInfoResponse.data) {
          const userInfoData = userInfoResponse.data;
          // 更新数据库中的头像和姓名（如果 SecondMe 有提供）
          if (userInfoData.avatar || userInfoData.name) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                ...(userInfoData.avatar && { avatar: userInfoData.avatar }),
                ...(userInfoData.name && { name: userInfoData.name }),
              },
            }).catch((err) => {
              console.error("更新用户信息失败:", err);
            });
          }

          return NextResponse.json({
            code: 0,
            data: {
              userId: userInfoData.userId || userInfoData.id || userInfoData.openId,
              name: userInfoData.name,
              email: userInfoData.email,
              avatar: userInfoData.avatar,
              bio: userInfoData.bio,
              selfIntroduction: userInfoData.selfIntroduction,
              profileCompleteness: userInfoData.profileCompleteness,
              route: userInfoData.route,
            },
          });
        }
      }
    } catch (error) {
      console.error("获取 SecondMe 用户信息失败，使用数据库缓存:", error);
    }

    // 如果无法获取实时信息，返回数据库中的缓存数据
    return NextResponse.json({
      code: 0,
      data: {
        userId: user.secondmeUserId,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error("获取用户信息失败:", error);
    return NextResponse.json(
      { code: 500, message: error.message || "获取用户信息失败" },
      { status: 500 }
    );
  }
}
