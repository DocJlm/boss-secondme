"use client";

import { JobCard } from "./JobCard";

interface Job {
  id: string;
  title: string;
  description: string;
  city: string | null;
  company: { name: string } | null;
  createdAt: Date;
}

interface JobsListClientProps {
  jobs: Job[];
}

export function JobsListClient({ jobs }: JobsListClientProps) {
  const handleAction = async (jobId: string, action: "like" | "pass") => {
    const response = await fetch("/api/match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ jobId, action }),
    });

    const result = await response.json();

    if (result.code !== 0) {
      throw new Error(result.message || "操作失败");
    }

    return result.data;
  };

  if (jobs.length === 0) {
    return (
      <p className="text-slate-500 text-sm">
        目前还没有任何开放职位，可以先以招聘方身份创建一些职位。
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onAction={handleAction} />
      ))}
    </ul>
  );
}
