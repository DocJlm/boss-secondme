"use client";

import { useState } from "react";

interface CandidateProfileFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
  initialData?: {
    name?: string | null;
    title?: string | null;
    city?: string | null;
    yearsExp?: number | null;
    skills?: string | null;
    bio?: string | null;
  };
}

export function CandidateProfileForm({ 
  onSuccess, 
  onCancel,
  mode = "create",
  initialData,
}: CandidateProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    title: initialData?.title || "",
    city: initialData?.city || "",
    yearsExp: initialData?.yearsExp?.toString() || "",
    skills: initialData?.skills || "",
    bio: initialData?.bio || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const apiEndpoint = mode === "edit" ? "/api/profile/edit" : "/api/profile/init";
      const method = mode === "edit" ? "PUT" : "POST";
      
      const response = await fetch(apiEndpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "candidate",
          name: formData.name || undefined,
          title: formData.title || undefined,
          city: formData.city || undefined,
          yearsExp: formData.yearsExp ? parseInt(formData.yearsExp) : undefined,
          skills: formData.skills || undefined,
          bio: formData.bio || undefined,
        }),
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || (mode === "edit" ? "更新失败" : "创建失败"));
      }

      onSuccess();
    } catch (error: any) {
      console.error(`${mode === "edit" ? "更新" : "创建"}候选人身份失败:`, error);
      alert(error.message || `${mode === "edit" ? "更新" : "创建"}失败，请稍后重试`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 pt-4 mt-4">
      <h3 className="text-base font-semibold text-slate-900 mb-3">
        {mode === "edit" ? "编辑候选人资料" : "创建候选人资料"}
      </h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            姓名（必填，简历抬头）
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="例如：张三"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            当前/期望职位
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="例如：前端工程师"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              所在城市 / 期望工作城市
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="例如：杭州"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              工作年限（整数，单位：年）
            </label>
            <input
              type="number"
              min="0"
              value={formData.yearsExp}
              onChange={(e) => setFormData({ ...formData, yearsExp: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="例如：3"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            技能 / 技术能力（逗号分隔）
          </label>
          <input
            type="text"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="例如：React, TypeScript, Node.js"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            个人简介（可写学校、项目、工作/实习经历等）
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="例如：\n- 学校：XX 大学 计算机科学与技术\n- 技术能力：React, TypeScript, Node.js\n- 工作/实习经历：在 XX 公司担任前端实习生，负责..."
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {loading ? (mode === "edit" ? "保存中..." : "创建中...") : (mode === "edit" ? "保存更改" : "创建候选人身份")}
        </button>
      </div>
    </form>
  );
}
