import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { secondmeConfig, getApiUrl, validateOAuthConfig } from "@/lib/config";
import type { ApiResponse, TokenResponse, UserInfo } from "@/lib/types";

/**
 * GET /api/auth/callback
 *
 * 处理 SecondMe OAuth2 回调：
 * 1. 读取 code
 * 2. 向 /api/oauth/token/code 换取 accessToken / refreshToken
 * 3. 使用 accessToken 调 /api/secondme/user/info 获取用户信息
 * 4. 将用户写入 PostgreSQL，并设置 session cookie
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    console.error("OAuth error from SecondMe:", error);
    return NextResponse.redirect(new URL("/?auth_error=access_denied", req.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/?auth_error=missing_code", req.url));
  }

  // 验证 OAuth 配置
  const configCheck = validateOAuthConfig();
  if (!configCheck.valid) {
    console.error("Missing OAuth config:", configCheck.missing.join(", "));
    return NextResponse.redirect(new URL("/?auth_error=server_config", req.url));
  }

  // 1) 用授权码换 Token
  const tokenRes = await fetch(getApiUrl(secondmeConfig.tokenEndpoint), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: secondmeConfig.oauth.redirectUri!,
      client_id: secondmeConfig.oauth.clientId!,
      client_secret: secondmeConfig.oauth.clientSecret!,
    }),
  });

  if (!tokenRes.ok) {
    console.error("Token exchange HTTP error:", tokenRes.status, await tokenRes.text());
    return NextResponse.redirect(new URL("/?auth_error=token_http", req.url));
  }

  const tokenJson = (await tokenRes.json()) as ApiResponse<TokenResponse>;
  if (tokenJson.code !== 0 || !tokenJson.data) {
    console.error("Token exchange business error:", tokenJson);
    return NextResponse.redirect(new URL("/?auth_error=token_business", req.url));
  }

  const { accessToken, refreshToken, expiresIn } = tokenJson.data;

  // 2) 使用 Access Token 获取用户信息
  const userInfoRes = await fetch(getApiUrl(secondmeConfig.endpoints.userInfo), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userInfoRes.ok) {
    console.error("User info HTTP error:", userInfoRes.status, await userInfoRes.text());
    return NextResponse.redirect(new URL("/?auth_error=user_http", req.url));
  }

  const userInfoJson = (await userInfoRes.json()) as ApiResponse<UserInfo>;
  if (userInfoJson.code !== 0 || !userInfoJson.data) {
    console.error("User info business error:", userInfoJson);
    return NextResponse.redirect(new URL("/?auth_error=user_business", req.url));
  }

  const { id, userId, name, avatar } = userInfoJson.data;
  const secondmeUserId = userId ?? id;

  if (!secondmeUserId) {
    console.error("Missing user id in SecondMe user info:", userInfoJson.data);
    return NextResponse.redirect(new URL("/?auth_error=no_user_id", req.url));
  }

  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  // 3) 写入数据库（存在则更新，不存在则创建）
  const user = await prisma.user.upsert({
    where: { secondmeUserId },
    update: {
      accessToken,
      refreshToken,
      tokenExpiresAt,
      // 更新头像和姓名（如果 SecondMe 有提供）
      ...(avatar && { avatar }),
      ...(name && { name }),
    },
    create: {
      secondmeUserId,
      accessToken,
      refreshToken,
      tokenExpiresAt,
      avatar: avatar || null,
      name: name || null,
    },
  });

  // 4) 设置一个简单的 session cookie，保存用户内部 id
  const response = NextResponse.redirect(new URL("/", req.url));

  response.cookies.set("session_user_id", user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 天
  });

  // 可选：在 URL 上加一个欢迎参数
  if (name) {
    response.headers.set("Location", `/?welcome=${encodeURIComponent(name)}`);
  }

  return response;
}

