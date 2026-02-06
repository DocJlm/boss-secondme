"use client";

interface Match {
  id: string;
  createdAt: Date;
  user: {
    id: string;
    candidateProfile: {
      id: string;
      name: string | null;
      title: string | null;
      city: string | null;
      yearsExp: number | null;
      skills: string | null;
      bio: string | null;
    } | null;
  } | null;
}

interface MatchesListClientProps {
  matches: Match[];
}

export function MatchesListClient({ matches }: MatchesListClientProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">
          目前还没有候选人对该职位感兴趣
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {matches.map((match) => {
        const profile = match.user?.candidateProfile;
        return (
          <li
            key={match.id}
            className="rounded-xl border border-slate-200 px-4 py-4 hover:border-slate-300 transition-colors bg-white"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    {profile?.name || "未填写姓名"}
                  </h3>
                  {profile?.title && (
                    <p className="text-sm text-slate-600 mt-1">
                      {profile.title}
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  匹配于 {new Date(match.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                {profile?.city && (
                  <div>
                    <span className="font-medium">城市：</span>
                    {profile.city}
                  </div>
                )}
                {profile?.yearsExp !== null && (
                  <div>
                    <span className="font-medium">工作年限：</span>
                    {profile?.yearsExp} 年
                  </div>
                )}
              </div>

              {profile?.skills && (
                <div>
                  <span className="text-sm font-medium text-slate-700">技能：</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.skills.split(",").map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile?.bio && (
                <div>
                  <span className="text-sm font-medium text-slate-700">个人简介：</span>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </div>
              )}

              {!profile && (
                <p className="text-sm text-slate-500 italic">
                  该候选人尚未完善个人资料
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
