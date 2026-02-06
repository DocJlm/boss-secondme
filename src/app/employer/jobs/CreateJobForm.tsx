"use client";

import { useState } from "react";

interface Job {
  id: string;
  title: string;
  city: string | null;
  status: string;
  createdAt: Date;
}

export function CreateJobForm({ onSuccess }: { onSuccess: (newJob: Job) => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    city: "",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "CNY",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          city: formData.city || undefined,
          salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : undefined,
          salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) : undefined,
          salaryCurrency: formData.salaryCurrency,
          tags: formData.tags || undefined,
        }),
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || "创建失败");
      }

      // 将返回的职位数据传递给父组件
      const newJob: Job = {
        id: result.data.id,
        title: result.data.title,
        city: result.data.city,
        status: result.data.status,
        createdAt: new Date(result.data.createdAt),
      };

      // 重置表单
      setFormData({
        title: "",
        description: "",
        city: "",
        salaryMin: "",
        salaryMax: "",
        salaryCurrency: "CNY",
        tags: "",
      });

      onSuccess(newJob);
    } catch (error: any) {
      console.error("创建职位失败:", error);
      alert(error.message || "创建失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 pt-6 mt-6">
      <h2 className="text-lg font-semibold text-slate-900">发布新职位</h2>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            职位名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：AI 产品经理"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            职位描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="详细描述职位要求、工作内容等..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">工作城市</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：杭州"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">薪资币种</label>
            <select
              value={formData.salaryCurrency}
              onChange={(e) => setFormData({ ...formData, salaryCurrency: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CNY">人民币 (CNY)</option>
              <option value="USD">美元 (USD)</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">最低薪资</label>
            <input
              type="number"
              value={formData.salaryMin}
              onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：30000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">最高薪资</label>
            <input
              type="number"
              value={formData.salaryMax}
              onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：50000"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">标签（逗号分隔）</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：AI,产品,全职"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
      >
        {loading ? "发布中..." : "发布职位"}
      </button>
    </form>
  );
}
