"use client";

import { useState } from "react";

interface EmployerProfileFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
  initialData?: {
    name?: string | null;
    title?: string | null;
    companyName?: string | null;
    companyCity?: string | null;
    companyWebsite?: string | null;
    companyIntro?: string | null;
  };
}

export function EmployerProfileForm({ 
  onSuccess, 
  onCancel,
  mode = "create",
  initialData,
}: EmployerProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    title: initialData?.title || "",
    companyName: initialData?.companyName || "",
    companyCity: initialData?.companyCity || "",
    companyWebsite: initialData?.companyWebsite || "",
    companyIntro: initialData?.companyIntro || "",
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
          role: "employer",
          name: formData.name || undefined,
          title: formData.title || undefined,
          companyName: formData.companyName || undefined,
          companyCity: formData.companyCity || undefined,
          companyWebsite: formData.companyWebsite || undefined,
          companyIntro: formData.companyIntro || undefined,
        }),
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || (mode === "edit" ? "更新失败" : "创建失败"));
      }

      onSuccess();
    } catch (error: any) {
      console.error(`${mode === "edit" ? "更新" : "创建"}招聘方身份失败:`, error);
      alert(error.message || `${mode === "edit" ? "更新" : "创建"}失败，请稍后重试`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 pt-4 mt-4">
      <h3 className="text-base font-semibold text-slate-900 mb-3">
        {mode === "edit" ? "编辑招聘方资料" : "创建招聘方身份"}
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              姓名
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="例如：李经理"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              职位
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="例如：HR"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            公司名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="例如：XX 科技有限公司"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            公司所在城市
          </label>
          <input
            type="text"
            value={formData.companyCity}
            onChange={(e) => setFormData({ ...formData, companyCity: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="例如：杭州"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            公司网站
          </label>
          <input
            type="url"
            value={formData.companyWebsite}
            onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="https://example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            公司简介
          </label>
          <textarea
            value={formData.companyIntro}
            onChange={(e) => setFormData({ ...formData, companyIntro: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="简单介绍一下公司..."
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
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {loading ? (mode === "edit" ? "保存中..." : "创建中...") : (mode === "edit" ? "保存更改" : "创建招聘方身份")}
        </button>
      </div>
    </form>
  );
}
