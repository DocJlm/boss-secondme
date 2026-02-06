"use client";

import { useState, useEffect } from "react";
import { CandidateProfileForm } from "../components/CandidateProfileForm";
import { EmployerProfileForm } from "../components/EmployerProfileForm";

interface EditProfileDialogProps {
  role: "candidate" | "employer";
  initialData?: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProfileDialog({
  role,
  initialData,
  onClose,
  onSuccess,
}: EditProfileDialogProps) {
  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {role === "candidate" ? "编辑候选人资料" : "编辑招聘方资料"}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {role === "candidate" ? (
            <CandidateProfileForm
              mode="edit"
              initialData={initialData}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          ) : (
            <EmployerProfileForm
              mode="edit"
              initialData={initialData}
              initialJobs={initialData?.jobs || []}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
