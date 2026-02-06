import { CandidateProfile, Job } from "@/generated/prisma/client";

/**
 * 计算候选人和职位的匹配度
 * @param candidate 候选人资料
 * @param job 职位信息
 * @returns 匹配度分数 (0-100)
 */
export function calculateMatchScore(
  candidate: CandidateProfile,
  job: Job
): number {
  let totalScore = 0;
  let weightSum = 0;

  // 1. 职位标题和描述匹配度 (35%) - 新增，考虑职位类型匹配
  const titleWeight = 0.35;
  const titleScore = calculateTitleMatch(candidate, job);
  totalScore += titleScore * titleWeight;
  weightSum += titleWeight;

  // 2. 技能匹配度 (30%)
  const skillsWeight = 0.3;
  const skillsScore = calculateSkillsMatch(candidate.skills, job.tags);
  totalScore += skillsScore * skillsWeight;
  weightSum += skillsWeight;

  // 3. 经验匹配度 (20%)
  const experienceWeight = 0.2;
  const experienceScore = calculateExperienceMatch(
    candidate.yearsExp || 0,
    job.tags
  );
  totalScore += experienceScore * experienceWeight;
  weightSum += experienceWeight;

  // 4. 城市匹配度 (10%)
  const cityWeight = 0.1;
  const cityScore = calculateCityMatch(candidate.city, job.city);
  totalScore += cityScore * cityWeight;
  weightSum += cityWeight;

  // 5. 其他因素 (5%) - 职位状态等
  const otherWeight = 0.05;
  const otherScore = job.status === "open" ? 100 : 0;
  totalScore += otherScore * otherWeight;
  weightSum += otherWeight;

  return Math.round(totalScore / weightSum);
}

/**
 * 计算职位标题和描述匹配度
 * 检查候选人的技能、职位与职位标题/描述的匹配度
 */
function calculateTitleMatch(
  candidate: CandidateProfile,
  job: Job
): number {
  // 提取候选人的技能和职位信息
  const candidateSkills = candidate.skills?.toLowerCase() || "";
  const candidateTitle = candidate.title?.toLowerCase() || "";
  
  // 提取职位的标题和描述
  const jobTitle = job.title.toLowerCase();
  const jobDescription = (job.description || "").toLowerCase();
  const jobTags = (job.tags || "").toLowerCase();
  
  // 合并所有职位相关信息
  const jobText = `${jobTitle} ${jobDescription} ${jobTags}`;
  
  // 定义技术岗位关键词
  const techKeywords = [
    "java", "python", "javascript", "typescript", "react", "vue", "angular",
    "node", "spring", "后端", "前端", "全栈", "开发", "工程师", "程序员",
    "算法", "架构", "系统", "软件", "编程", "代码", "技术"
  ];
  
  // 定义非技术岗位关键词
  const nonTechKeywords = [
    "运营", "市场", "销售", "客服", "行政", "人事", "财务", "会计",
    "设计", "美工", "文案", "编辑", "策划", "推广", "商务"
  ];
  
  // 检查候选人是否是技术岗位
  const candidateIsTech = techKeywords.some(
    keyword => candidateSkills.includes(keyword) || candidateTitle.includes(keyword)
  );
  
  // 检查职位是否是技术岗位
  const jobIsTech = techKeywords.some(keyword => jobText.includes(keyword));
  const jobIsNonTech = nonTechKeywords.some(keyword => jobText.includes(keyword));
  
  // 如果候选人技术岗但职位是非技术岗，或者相反，给很低的分
  if (candidateIsTech && jobIsNonTech) {
    return 10; // 严重不匹配
  }
  if (!candidateIsTech && jobIsTech) {
    return 15; // 严重不匹配
  }
  
  // 如果都是技术岗或都是非技术岗，继续计算匹配度
  // 提取候选人的主要技能关键词
  const candidateSkillList = candidateSkills
    .split(/[,，、]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // 计算技能在职位描述中的匹配度
  let matchCount = 0;
  for (const skill of candidateSkillList) {
    if (jobText.includes(skill) || (skill.length >= 2 && jobText.includes(skill.substring(0, 2)))) {
      matchCount++;
    }
  }
  
  // 如果候选人有职位相关的技能，给高分
  if (candidateSkillList.length > 0) {
    const matchRatio = matchCount / candidateSkillList.length;
    return Math.min(100, Math.round(60 + matchRatio * 40)); // 基础60分，匹配度越高分数越高
  }
  
  // 如果候选人没有技能信息，但类型匹配，给中等分数
  if (candidateIsTech && jobIsTech) {
    return 60;
  }
  if (!candidateIsTech && !jobIsTech && !jobIsNonTech) {
    return 50;
  }
  
  return 50; // 默认中等匹配度
}

/**
 * 计算技能匹配度
 */
function calculateSkillsMatch(
  candidateSkills: string | null,
  jobTags: string | string[] | null
): number {
  // 处理 jobTags：可能是字符串或数组
  let jobTagList: string[] = [];
  if (Array.isArray(jobTags)) {
    jobTagList = jobTags.map((t) => String(t).trim().toLowerCase());
  } else if (typeof jobTags === "string" && jobTags.trim()) {
    jobTagList = jobTags
      .split(/[,，、]/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);
  }

  if (!candidateSkills || jobTagList.length === 0) {
    return 50; // 默认中等匹配度
  }

  const candidateSkillList = candidateSkills
    .split(/[,，、]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);

  // 计算匹配的技能数量
  let matchCount = 0;
  for (const skill of candidateSkillList) {
    if (jobTagList.some((tag) => tag.includes(skill) || skill.includes(tag))) {
      matchCount++;
    }
  }

  if (candidateSkillList.length === 0) {
    return 50;
  }

  // 匹配度 = 匹配的技能数 / 候选人技能总数 * 100
  const matchRatio = matchCount / candidateSkillList.length;
  return Math.min(100, Math.round(matchRatio * 100));
}

/**
 * 计算经验匹配度
 */
function calculateExperienceMatch(
  candidateYearsExp: number,
  jobTags: string | string[] | null
): number {
  // 处理 jobTags：可能是字符串或数组
  let jobTagList: string[] = [];
  if (Array.isArray(jobTags)) {
    jobTagList = jobTags.map((t) => String(t).trim());
  } else if (typeof jobTags === "string" && jobTags.trim()) {
    jobTagList = jobTags
      .split(/[,，、]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  // 从职位标签中提取经验要求
  const experienceKeywords = ["应届", "1年", "2年", "3年", "5年", "10年"];
  let requiredYears = 0;

  for (const tag of jobTagList) {
    for (const keyword of experienceKeywords) {
      if (tag.includes(keyword)) {
        const match = tag.match(/(\d+)/);
        if (match) {
          requiredYears = parseInt(match[1], 10);
          break;
        }
      }
    }
  }

  if (requiredYears === 0) {
    return 70; // 如果没有明确要求，给中等偏上的分数
  }

  // 经验匹配度计算
  const diff = Math.abs(candidateYearsExp - requiredYears);
  if (diff === 0) {
    return 100;
  } else if (diff <= 1) {
    return 90;
  } else if (diff <= 2) {
    return 70;
  } else if (diff <= 3) {
    return 50;
  } else {
    return Math.max(20, 100 - diff * 10);
  }
}

/**
 * 计算城市匹配度
 */
function calculateCityMatch(
  candidateCity: string | null,
  jobCity: string | null
): number {
  if (!candidateCity || !jobCity) {
    return 50; // 如果信息缺失，给中等分数
  }

  if (candidateCity === jobCity) {
    return 100;
  }

  // 部分匹配（例如：北京 vs 北京市）
  const candidateCityLower = candidateCity.toLowerCase().replace(/市|省/g, "");
  const jobCityLower = jobCity.toLowerCase().replace(/市|省/g, "");

  if (candidateCityLower === jobCityLower) {
    return 100;
  }

  // 如果城市不同，但都在一线城市，给部分分数
  const tier1Cities = ["北京", "上海", "广州", "深圳", "杭州"];
  const candidateIsTier1 = tier1Cities.some((city) =>
    candidateCity.includes(city)
  );
  const jobIsTier1 = tier1Cities.some((city) => jobCity.includes(city));

  if (candidateIsTier1 && jobIsTier1) {
    return 60; // 都在一线城市，给部分分数
  }

  return 30; // 城市不匹配，给较低分数
}

/**
 * 对候选人列表按匹配度排序
 */
export function sortCandidatesByMatchScore(
  candidates: Array<{ candidate: CandidateProfile; matchScore: number }>
): Array<{ candidate: CandidateProfile; matchScore: number }> {
  return candidates.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * 对职位列表按匹配度排序
 */
export function sortJobsByMatchScore(
  jobs: Array<{ job: Job; matchScore: number }>
): Array<{ job: Job; matchScore: number }> {
  return jobs.sort((a, b) => b.matchScore - a.matchScore);
}
