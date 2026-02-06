"use client";

import { useState, useEffect } from "react";

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
  initialJobs?: Array<{
    id: string;
    title: string;
    description?: string | null;
    city?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string | null;
    tags?: string | null;
    status?: string;
  }>;
}

export function EmployerProfileForm({ 
  onSuccess, 
  onCancel,
  mode = "create",
  initialData,
  initialJobs = [],
}: EmployerProfileFormProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "jobs">("profile");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    title: initialData?.title || "",
    companyName: initialData?.companyName || "",
    companyCity: initialData?.companyCity || "",
    companyWebsite: initialData?.companyWebsite || "",
    companyIntro: initialData?.companyIntro || "",
  });
  const [jobs, setJobs] = useState(initialJobs);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobFormData, setJobFormData] = useState({
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

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const url = editingJobId ? `/api/jobs/${editingJobId}` : "/api/jobs";
      const method = editingJobId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: jobFormData.title,
          description: jobFormData.description,
          city: jobFormData.city || undefined,
          salaryMin: jobFormData.salaryMin ? parseInt(jobFormData.salaryMin) : undefined,
          salaryMax: jobFormData.salaryMax ? parseInt(jobFormData.salaryMax) : undefined,
          salaryCurrency: jobFormData.salaryCurrency,
          tags: jobFormData.tags || undefined,
        }),
      });

      const result = await response.json();

      if (result.code !== 0) {
        throw new Error(result.message || (editingJobId ? "更新失败" : "创建失败"));
      }

      if (editingJobId) {
        setJobs(jobs.map(j => j.id === editingJobId ? result.data : j));
      } else {
        setJobs([...jobs, result.data]);
      }
      
      setShowJobForm(false);
      setEditingJobId(null);
      setJobFormData({
        title: "",
        description: "",
        city: "",
        salaryMin: "",
        salaryMax: "",
        salaryCurrency: "CNY",
        tags: "",
      });
    } catch (error: any) {
      console.error(`${editingJobId ? "更新" : "创建"}职位失败:`, error);
      alert(error.message || `${editingJobId ? "更新" : "创建"}失败，请稍后重试`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("确定要删除这个职位吗？此操作不可恢复。")) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.code === 0) {
        setJobs(jobs.filter(j => j.id !== jobId));
      } else {
        alert(result.message || "删除失败");
      }
    } catch (error) {
      console.error("删除职位失败:", error);
      alert("删除失败，请稍后重试");
    }
  };

  const startEditJob = (job: typeof jobs[0]) => {
    setEditingJobId(job.id);
    setJobFormData({
      title: job.title,
      description: job.description || "",
      city: job.city || "",
      salaryMin: job.salaryMin?.toString() || "",
      salaryMax: job.salaryMax?.toString() || "",
      salaryCurrency: job.salaryCurrency || "CNY",
      tags: job.tags || "",
    });
    setShowJobForm(true);
  };

  return (
    <div className="space-y-4">
      {/* 标签页切换 */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "profile"
              ? "text-emerald-600 border-b-2 border-emerald-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          基本信息
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("jobs")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "jobs"
              ? "text-emerald-600 border-b-2 border-emerald-600"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          职位管理 ({jobs.length})
        </button>
      </div>

      {/* 基本信息标签页 */}
      {activeTab === "profile" && (
        <form onSubmit={handleSubmit} className="space-y-4">
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
      )}

      {/* 职位管理标签页 */}
      {activeTab === "jobs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">职位管理</h3>
            {!showJobForm && (
              <button
                type="button"
                onClick={() => {
                  setShowJobForm(true);
                  setEditingJobId(null);
                  setJobFormData({
                    title: "",
                    description: "",
                    city: "",
                    salaryMin: "",
                    salaryMax: "",
                    salaryCurrency: "CNY",
                    tags: "",
                  });
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                新增职位
              </button>
            )}
          </div>

          {showJobForm && (
            <form onSubmit={handleJobSubmit} className="space-y-3 p-4 border border-slate-200 rounded-lg bg-slate-50">
              <h4 className="text-sm font-semibold text-slate-900">
                {editingJobId ? "编辑职位" : "新增职位"}
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  职位名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={jobFormData.title}
                  onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="例如：AI 产品经理"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  职位描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={jobFormData.description}
                  onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="详细描述职位要求、工作内容等..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">工作城市</label>
                  <input
                    type="text"
                    value={jobFormData.city}
                    onChange={(e) => setJobFormData({ ...jobFormData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="例如：杭州"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">薪资币种</label>
                  <select
                    value={jobFormData.salaryCurrency}
                    onChange={(e) => setJobFormData({ ...jobFormData, salaryCurrency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  >
                    <option value="CNY">人民币 (CNY)</option>
                    <option value="USD">美元 (USD)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">最低薪资</label>
                  <input
                    type="number"
                    value={jobFormData.salaryMin}
                    onChange={(e) => setJobFormData({ ...jobFormData, salaryMin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="例如：30000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">最高薪资</label>
                  <input
                    type="number"
                    value={jobFormData.salaryMax}
                    onChange={(e) => setJobFormData({ ...jobFormData, salaryMax: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                    placeholder="例如：50000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">标签（逗号分隔）</label>
                <input
                  type="text"
                  value={jobFormData.tags}
                  onChange={(e) => setJobFormData({ ...jobFormData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  placeholder="例如：AI,产品,全职"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJobForm(false);
                    setEditingJobId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {loading ? (editingJobId ? "保存中..." : "发布中...") : (editingJobId ? "保存更改" : "发布职位")}
                </button>
              </div>
            </form>
          )}

          {jobs.length === 0 && !showJobForm ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              还没有发布任何职位
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div key={job.id} className="p-3 border border-slate-200 rounded-lg bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-slate-900">{job.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {job.city || "未填写城市"} · {job.status || "open"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        type="button"
                        onClick={() => startEditJob(job)}
                        className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteJob(job.id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
