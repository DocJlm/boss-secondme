import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidAccessToken, getUserInfo } from "@/lib/secondme";

/**
 * GET /api/secondme/user/info
 *
 * 实时获取当前登录用户的 SecondMe 信息（包括头像、姓名等）
 * 这个API会实时调用 SecondMe API，确保数据是最新的
 */
export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("session_user_id");
  if (!sessionCookie?.value) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const userId = sessionCookie.value;

  try {
    // 获取有效的 accessToken
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      return NextResponse.json(
        { code: 401, message: "无法获取有效的访问令牌" },
        { status: 401 }
      );
    }

    // 实时调用 SecondMe API 获取用户信息
    const userInfo = await getUserInfo(accessToken);

    if (userInfo.code !== 0 || !userInfo.data) {
      return NextResponse.json(
        { code: userInfo.code || 500, message: userInfo.message || "获取用户信息失败" },
        { status: userInfo.code || 500 }
      );
    }

    // 更新数据库中的头像和姓名（如果 SecondMe 有提供）
    if (userInfo.data.avatar || userInfo.data.name) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(userInfo.data.avatar && { avatar: userInfo.data.avatar }),
          ...(userInfo.data.name && { name: userInfo.data.name }),
        },
      }).catch((err) => {
        console.error("更新用户信息失败:", err);
        // 不阻止返回，继续返回 SecondMe 的数据
      });
    }

    return NextResponse.json({
      code: 0,
      data: {
        userId: userInfo.data.userId || userInfo.data.id,
        name: userInfo.data.name,
        email: userInfo.data.email,
        avatar: userInfo.data.avatar,
        bio: userInfo.data.bio,
        selfIntroduction: userInfo.data.selfIntroduction,
        profileCompleteness: userInfo.data.profileCompleteness,
        route: userInfo.data.route,
      },
    });
  } catch (error: any) {
    console.error("获取 SecondMe 用户信息失败:", error);
    return NextResponse.json(
      { code: 500, message: error.message || "获取用户信息失败" },
      { status: 500 }
    );
  }
}
