"use client";

import { useState } from "react";
import { CandidateProfileForm } from "./CandidateProfileForm";
import { EmployerProfileForm } from "./EmployerProfileForm";

interface HomeClientProps {
  hasCandidateProfile: boolean;
  hasEmployerProfile: boolean;
}

export function HomeClient({ hasCandidateProfile, hasEmployerProfile }: HomeClientProps) {
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showEmployerForm, setShowEmployerForm] = useState(false);

  const handleCandidateSuccess = () => {
    setShowCandidateForm(false);
    window.location.reload();
  };

  const handleEmployerSuccess = () => {
    setShowEmployerForm(false);
    window.location.reload();
  };

  return (
    <>
      <div className="space-y-3 mb-4">
        {hasCandidateProfile ? (
          <>
            <a
              href="/jobs"
              className="block w-full text-center rounded-xl bg-orange-600 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-orange-700 transition-colors"
            >
              候选人：浏览职位列表
            </a>
            <a
              href="/jobs/recommend"
              className="block w-full text-center rounded-xl bg-orange-500 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-orange-600 transition-colors"
            >
              AI 职位推荐
            </a>
            <a
              href="/matches"
              className="block w-full text-center rounded-xl bg-orange-400 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-orange-500 transition-colors"
            >
              我的匹配
            </a>
          </>
        ) : (
          <div className="rounded-lg border border-slate-200 px-4 py-3 bg-slate-50">
            {showCandidateForm ? (
              <CandidateProfileForm
                onSuccess={handleCandidateSuccess}
                onCancel={() => setShowCandidateForm(false)}
              />
            ) : (
              <>
                <p className="text-xs text-slate-600 mb-2">
                  你还没有候选人身份
                </p>
                <button
                  onClick={() => setShowCandidateForm(true)}
                  className="w-full mt-2 px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors shadow-md"
                >
                  创建候选人身份
                </button>
              </>
            )}
          </div>
        )}
        {hasEmployerProfile ? (
          <a
            href="/employer/jobs"
            className="block w-full text-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            招聘方：管理我的职位
          </a>
        ) : (
          <div className="rounded-lg border border-slate-200 px-4 py-3 bg-slate-50">
            {showEmployerForm ? (
              <EmployerProfileForm
                onSuccess={handleEmployerSuccess}
                onCancel={() => setShowEmployerForm(false)}
              />
            ) : (
              <>
                <p className="text-xs text-slate-600 mb-2">
                  你还没有招聘方身份
                </p>
                <button
                  onClick={() => setShowEmployerForm(true)}
                  className="w-full mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  创建招聘方身份
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
