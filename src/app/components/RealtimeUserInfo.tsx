"use client";

import { useEffect, useState } from "react";

interface UserInfo {
  avatar: string | null;
  name: string | null;
}

interface RealtimeUserInfoProps {
  targetUserId: string; // 明确指定要获取哪个用户的信息
  initialAvatar?: string | null;
  initialName?: string | null;
  onUpdate?: (info: UserInfo) => void;
}

export function RealtimeUserInfo({
  targetUserId,
  initialAvatar,
  initialName,
  onUpdate,
}: RealtimeUserInfoProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    avatar: initialAvatar || null,
    name: initialName || null,
  });

  useEffect(() => {
    // 实时获取指定用户的 SecondMe 用户信息
    const fetchUserInfo = async () => {
      try {
        // 通过 targetUserId 获取用户信息
        const response = await fetch(`/api/user/${targetUserId}/info`);
        const result = await response.json();
        
        if (result.code === 0 && result.data) {
          const newInfo: UserInfo = {
            // 如果API返回了新的头像，使用新头像；否则保持现有头像或初始头像
            avatar: result.data.avatar || userInfo.avatar || initialAvatar || null,
            name: result.data.name || userInfo.name || initialName || null,
          };
          setUserInfo(newInfo);
          if (onUpdate) {
            onUpdate(newInfo);
          }
        } else {
          // API调用成功但数据为空，保持现有值
          if (onUpdate && (userInfo.avatar || initialAvatar || userInfo.name || initialName)) {
            onUpdate({
              avatar: userInfo.avatar || initialAvatar || null,
              name: userInfo.name || initialName || null,
            });
          }
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        // 如果API调用失败，保持现有值或使用初始值，不设置为null
        if (onUpdate) {
          const currentInfo: UserInfo = {
            avatar: userInfo.avatar || initialAvatar || null,
            name: userInfo.name || initialName || null,
          };
          // 只有在有值的情况下才更新
          if (currentInfo.avatar || currentInfo.name) {
            onUpdate(currentInfo);
          }
        }
      }
    };

    if (targetUserId) {
      fetchUserInfo();
      // 设置定时刷新（每30秒刷新一次）
      const interval = setInterval(fetchUserInfo, 30000);
      return () => clearInterval(interval);
    }
  }, [targetUserId]); // 移除 onUpdate 和 initialAvatar/initialName 依赖，避免无限循环

  return null; // 这个组件不渲染任何内容，只负责更新状态
}
