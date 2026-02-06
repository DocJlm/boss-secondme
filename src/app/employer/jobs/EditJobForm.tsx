"use client";

import { useState } from "react";

interface Job {
  id: string;
  title: string;
  description: string;
  city: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  tags: string | null;
  status: string;
}

interface EditJobFormProps {
  job: Job;
  onSuccess: (updatedJob: Job) => void;
  onCancel: () => void;
}

export function EditJobForm({ job, onSuccess, onCancel }: EditJobFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: job.title,
    description: job.description,
    city: job.city || "",
    salaryMin: job.salaryMin?.toString() || "",
    salaryMax: job.salaryMax?.toString() || "",
    salaryCurrency: job.salaryCurrency || "CNY",
    tags: job.tags || "",
    status: job.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
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
          status: formData.status,
        }),
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || "更新失败");
      }

      // 将返回的职位数据传递给父组件
      const updatedJob: Job = {
        id: result.data.id,
        title: result.data.title,
        description: result.data.description,
        city: result.data.city,
        salaryMin: result.data.salaryMin,
        salaryMax: result.data.salaryMax,
        salaryCurrency: result.data.salaryCurrency,
        tags: result.data.tags,
        status: result.data.status,
      };

      onSuccess(updatedJob);
    } catch (error: any) {
      console.error("更新职位失败:", error);
      alert(error.message || "更新失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">编辑职位</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          取消
        </button>
      </div>
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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="open">开放</option>
            <option value="closed">关闭</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {loading ? "更新中..." : "保存更改"}
        </button>
      </div>
    </form>
  );
}
