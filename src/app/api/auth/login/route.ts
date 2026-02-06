import { NextRequest, NextResponse } from "next/server";
import { secondmeConfig, validateOAuthConfig } from "@/lib/config";

/**
 * GET /api/auth/login
 *
 * 构造 SecondMe OAuth2 授权地址并重定向用户过去登录授权。
 * 根据 Second-Me-Skills 最佳实践，使用配置管理而非硬编码。
 */
export async function GET(_req: NextRequest) {
  // 验证 OAuth 配置
  const configCheck = validateOAuthConfig();
  if (!configCheck.valid) {
    console.error("Missing OAuth config:", configCheck.missing.join(", "));
    return NextResponse.json(
      { error: "Server OAuth config missing", missing: configCheck.missing },
      { status: 500 }
    );
  }

  // 生成随机 state（CSRF 防护）
  // 根据 Skill 文档，在 WebView 环境中可以放宽验证
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: secondmeConfig.oauth.clientId!,
    redirect_uri: secondmeConfig.oauth.redirectUri!,
    response_type: "code",
    state,
    scope: secondmeConfig.oauth.scopes.join(" "),
  });

  const authorizeUrl = `${secondmeConfig.oauthUrl}?${params.toString()}`;

  return NextResponse.redirect(authorizeUrl);
}

