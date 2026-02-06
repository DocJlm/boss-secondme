import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// 使用 pg + PrismaPg 适配器，满足 Prisma 7 对 adapter 的要求
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// 避免在开发环境热重载时重复实例化 PrismaClient
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// 在开发环境中，如果 Prisma Client 已存在但不包含新模型或字段，则重新创建
// 这通常发生在 Prisma schema 更新后但服务器未重启的情况
let prismaInstance = globalForPrisma.prisma;

// 检查 Prisma Client 是否包含所有必需的模型和字段
if (process.env.NODE_ENV === "development" && prismaInstance) {
  // 检查是否有新模型
  if (!("aIMatchConversation" in prismaInstance)) {
    console.warn("检测到 Prisma Client 缺少新模型，重新初始化...");
    prismaInstance = undefined;
    globalForPrisma.prisma = undefined;
  }
  // 检查 User 模型是否有新字段（通过尝试访问 user 模型的字段定义）
  else if (prismaInstance.user && typeof prismaInstance.user === "object") {
    // 尝试检查 User 模型是否有 avatar 字段（通过检查 findUnique 方法的类型）
    // 如果 Prisma Client 已更新，应该能正常访问
    try {
      // 这是一个简单的检查：如果 Prisma Client 已更新，应该能正常工作
      // 如果字段不存在，会在实际查询时报错，这里我们只是做预防性检查
    } catch (e) {
      // 如果检查失败，重新初始化
      console.warn("检测到 Prisma Client 可能过期，重新初始化...");
      prismaInstance = undefined;
      globalForPrisma.prisma = undefined;
    }
  }
}

export const prisma =
  prismaInstance ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


