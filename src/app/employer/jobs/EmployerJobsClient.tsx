"use client";

import { useState, useCallback } from "react";
import { CreateJobForm } from "./CreateJobForm";
import { EditJobForm } from "./EditJobForm";

interface Job {
  id: string;
  title: string;
  description?: string;
  city: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  tags?: string | null;
  status: string;
  createdAt: Date | string;
}

interface EmployerJobsClientProps {
  initialJobs: Job[];
}

export function EmployerJobsClient({ initialJobs }: EmployerJobsClientProps) {
  // 确保 initialJobs 中的日期格式统一
  const normalizedInitialJobs = initialJobs.map((job) => ({
    ...job,
    createdAt: job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt),
  }));

  const [jobs, setJobs] = useState<Job[]>(normalizedInitialJobs);
  const [showForm, setShowForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const handleCancelForm = useCallback(() => {
    setShowForm(false);
  }, []);

  const handleSuccess = useCallback((newJob: Job) => {
    // 确保新职位的日期格式正确
    const normalizedNewJob = {
      ...newJob,
      createdAt: newJob.createdAt instanceof Date ? newJob.createdAt : new Date(newJob.createdAt),
    };
    // 将新职位添加到列表最前面（因为按创建时间倒序）
    setJobs((prev) => [normalizedNewJob, ...prev]);
    setShowForm(false);
  }, []);

  const handleEditSuccess = useCallback((updatedJob: Omit<Job, "createdAt">) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === updatedJob.id ? { ...job, ...updatedJob } : job
      )
    );
    setEditingJobId(null);
  }, []);

  return (
    <>
      {jobs.length === 0 && !showForm ? (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm mb-4">
            你还没有发布任何职位
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            发布第一个职位
          </button>
        </div>
      ) : (
        <>
          {jobs.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">共 {jobs.length} 个职位</p>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  发布新职位
                </button>
              )}
            </div>
          )}
          {showForm && (
            <div>
              <CreateJobForm 
                onSuccess={handleSuccess}
                onCancel={handleCancelForm}
              />
            </div>
          )}
          {jobs.length > 0 && (
            <ul className="space-y-4">
              {jobs.map((job) => (
                <li key={job.id}>
                  {editingJobId === job.id ? (
                    <EditJobForm
                      job={{
                        id: job.id,
                        title: job.title,
                        description: job.description || "",
                        city: job.city,
                        salaryMin: job.salaryMin ?? null,
                        salaryMax: job.salaryMax ?? null,
                        salaryCurrency: job.salaryCurrency ?? null,
                        tags: job.tags ?? null,
                        status: job.status,
                      }}
                      onSuccess={handleEditSuccess}
                      onCancel={() => setEditingJobId(null)}
                    />
                  ) : (
                    <div className="rounded-xl border border-slate-200 px-4 py-3 hover:border-slate-300 transition-colors bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h2 className="text-base font-semibold text-slate-900">
                            {job.title}
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
                            工作地点：{job.city ?? "未填写"} · 状态：{job.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-slate-400">
                            {(job.createdAt instanceof Date ? job.createdAt : new Date(job.createdAt)).toLocaleDateString("zh-CN")}
                          </span>
                          <a
                            href={`/employer/jobs/${job.id}/matches`}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            查看匹配
                          </a>
                          <button
                            onClick={() => setEditingJobId(job.id)}
                            className="px-3 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`确定要删除职位「${job.title}」吗？此操作不可恢复。`)) {
                                return;
                              }
                              try {
                                const response = await fetch(`/api/jobs/${job.id}`, {
                                  method: "DELETE",
                                });
                                const result = await response.json();
                                if (result.code === 0) {
                                  setJobs((prev) => prev.filter((j) => j.id !== job.id));
                                } else {
                                  alert(result.message || "删除失败");
                                }
                              } catch (error) {
                                console.error("删除职位失败:", error);
                                alert("删除失败，请稍后重试");
                              }
                            }}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
