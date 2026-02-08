"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CandidateProfileForm } from "./CandidateProfileForm";
import { EmployerProfileForm } from "./EmployerProfileForm";

interface HomeClientProps {
  hasCandidateProfile: boolean;
  hasEmployerProfile: boolean;
}

export function HomeClient({ hasCandidateProfile, hasEmployerProfile }: HomeClientProps) {
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showEmployerForm, setShowEmployerForm] = useState(false);
  const router = useRouter();

  const handleCandidateSuccess = () => {
    setShowCandidateForm(false);
    window.location.reload();
  };

  const handleEmployerSuccess = () => {
    setShowEmployerForm(false);
    window.location.reload();
  };

  const handleSwitchToCandidate = async () => {
    try {
      const response = await fetch("/api/user/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "candidate" }),
      });
      const result = await response.json();
      if (result.code === 0) {
        router.push("/plaza");
      }
    } catch (error) {
      console.error("切换身份失败:", error);
    }
  };

  const handleSwitchToEmployer = async () => {
    try {
      const response = await fetch("/api/user/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "employer" }),
      });
      const result = await response.json();
      if (result.code === 0) {
        router.push("/plaza/employer");
      }
    } catch (error) {
      console.error("切换身份失败:", error);
    }
  };

  return (
    <>
      <div className="space-y-3 mb-4">
        {hasCandidateProfile ? (
          <>
            <a
              href="/plaza"
              className="block w-full text-center rounded-xl bg-orange-600 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-orange-700 transition-colors"
            >
              候选人：进入广场
            </a>
            {hasEmployerProfile && (
              <button
                onClick={handleSwitchToEmployer}
                className="block w-full text-center rounded-xl bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-lg hover:bg-emerald-700 transition-colors"
              >
                切换到招聘方身份
              </button>
            )}
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
          <>
            <a
              href="/plaza/employer"
              className="block w-full text-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              招聘方：进入广场
            </a>
            {hasCandidateProfile && (
              <button
                onClick={handleSwitchToCandidate}
                className="block w-full text-center rounded-lg bg-orange-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-orange-700 transition-colors"
              >
                切换到候选人身份
              </button>
            )}
          </>
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
