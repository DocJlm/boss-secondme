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

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-orange-100 flex items-center justify-center overflow-hidden ${className}`}>
      {avatar ? (
        <Image
          src={avatar}
          alt={name || "用户"}
          width={sizePixels[size]}
          height={sizePixels[size]}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : (
        <span className="text-orange-600 font-medium">
          {name?.[0]?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}
