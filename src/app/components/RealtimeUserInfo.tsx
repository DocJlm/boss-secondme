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
        // 注意：这里需要创建一个新的API端点来根据userId获取用户信息
        // 或者使用现有的API，但需要传递targetUserId参数
        const response = await fetch(`/api/user/${targetUserId}/info`);
        const result = await response.json();
        
        if (result.code === 0 && result.data) {
          const newInfo: UserInfo = {
            avatar: result.data.avatar || null,
            name: result.data.name || null,
          };
          setUserInfo(newInfo);
          if (onUpdate) {
            onUpdate(newInfo);
          }
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        // 如果API调用失败，使用初始值
        if (onUpdate && (initialAvatar || initialName)) {
          onUpdate({
            avatar: initialAvatar || null,
            name: initialName || null,
          });
        }
      }
    };

    if (targetUserId) {
      fetchUserInfo();
    }
  }, [targetUserId, initialAvatar, initialName, onUpdate]);

  return null; // 这个组件不渲染任何内容，只负责更新状态
}
