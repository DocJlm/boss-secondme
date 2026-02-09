"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface UserAvatarProps {
  userId: string;
  fallbackName?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ userId, fallbackName, size = "md", className = "" }: UserAvatarProps) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(fallbackName || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 实时获取 SecondMe 用户信息
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/secondme/user/info");
        const result = await response.json();
        
        if (result.code === 0 && result.data) {
          if (result.data.avatar) {
            setAvatar(result.data.avatar);
          }
          if (result.data.name) {
            setName(result.data.name);
          }
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [userId]);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-32 h-32 text-4xl",
  };

  const sizePixels = {
    sm: 32,
    md: 40,
    lg: 128,
  };

  if (loading) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-slate-200 animate-pulse ${className}`} />
    );
  }

  const defaultAvatarUrl = "https://th.bing.com/th/id/OIP.Ao5SmjJyn7JTB6_iQjPkmgAAAA?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3";

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-[#FFE5EC] to-[#FFECD2] flex items-center justify-center overflow-hidden ${className}`}>
      {avatar ? (
        <Image
          src={avatar}
          alt={name || "用户"}
          width={sizePixels[size]}
          height={sizePixels[size]}
          className="w-full h-full object-cover"
          unoptimized
          onError={(e) => {
            // 如果头像加载失败，使用默认图片
            const target = e.target as HTMLImageElement;
            if (target.src !== defaultAvatarUrl) {
              target.src = defaultAvatarUrl;
            }
          }}
        />
      ) : (
        <Image
          src={defaultAvatarUrl}
          alt={name || "用户"}
          width={sizePixels[size]}
          height={sizePixels[size]}
          className="w-full h-full object-cover"
          unoptimized
        />
      )}
    </div>
  );
}
