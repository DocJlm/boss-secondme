import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, getUserInfo } from "@/lib/secondme";

/**
 * GET /api/user/[userId]/secondme-route
 *
 * 根据 userId 获取该用户的 SecondMe route（用于构建真实主页链接）
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
      },
    });

    if (!user || !user.secondmeUserId) {
      return NextResponse.json(
        { code: 404, message: "用户不存在或没有 SecondMe 用户ID" },
        { status: 404 }
      );
    }

    // 尝试获取有效的 accessToken 并实时获取 SecondMe route
    try {
      const accessToken = await getValidAccessToken(user.id);
      if (accessToken) {
        // 实时调用 SecondMe API 获取用户信息
        const userInfoResponse = await getUserInfo(accessToken);

        // getUserInfo 返回的是 API 响应对象，包含 code 和 data
        if (userInfoResponse && userInfoResponse.code === 0 && userInfoResponse.data) {
          const userInfoData = userInfoResponse.data;
          
          // 返回 route
          if (userInfoData.route) {
            return NextResponse.json({
              code: 0,
              data: {
                route: userInfoData.route,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error("获取 SecondMe route 失败:", error);
      // 继续尝试其他方式
    }

    // 如果无法获取实时信息，返回错误（因为 route 必须从 SecondMe API 获取）
    return NextResponse.json(
      { code: 404, message: "无法获取用户的 SecondMe route" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("获取用户 SecondMe route 失败:", error);
    return NextResponse.json(
      { code: 500, message: error.message || "获取用户 SecondMe route 失败" },
      { status: 500 }
    );
  }
}
