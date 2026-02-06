import { getValidAccessToken, callSecondMeChat } from "@/lib/secondme";

/**
 * 构建候选人系统提示词（场景设置）
 */
export function buildCandidateSystemPrompt(
  candidateProfile: {
    name: string | null;
    title: string | null;
    city: string | null;
    yearsExp: number | null;
    skills: string | null;
    bio: string | null;
  },
  jobInfo: {
    title: string;
    companyName: string;
  }
): string {
  return `你是候选人${candidateProfile.name ? ` ${candidateProfile.name}` : ""}，正在与 ${jobInfo.companyName} 的 HR 进行工作相关的对话，讨论 ${jobInfo.title} 职位。

你的背景：
- 当前职位：${candidateProfile.title || "未填写"}
- 工作年限：${candidateProfile.yearsExp || 0} 年
- 技能：${candidateProfile.skills || "未填写"}
- 个人简介：${candidateProfile.bio || "未填写"}

对话目标：
1. 展示你的技能和经验
2. 了解职位详情和公司情况
3. 表达对职位的兴趣
4. 回答 HR 的问题，展示你的匹配度

对话规则：
- 保持专业，只讨论工作相关话题
- 不要聊兴趣爱好、日常生活等无关内容
- 回答要真实、专业、有针对性
- 主动提问，了解职位详情`;
}

/**
 * 构建候选人对话提示词（保留用于向后兼容）
 * @deprecated 使用 buildCandidateSystemPrompt 替代
 */
export function buildCandidatePrompt(
  candidateProfile: {
    name: string | null;
    title: string | null;
    city: string | null;
    yearsExp: number | null;
    skills: string | null;
    bio: string | null;
  },
  jobInfo: {
    title: string;
    companyName: string;
  }
): string {
  const systemPrompt = buildCandidateSystemPrompt(candidateProfile, jobInfo);
  return `${systemPrompt}\n\n现在开始对话，请先做一个简短的自我介绍，表达对这个职位的兴趣。`;
}

/**
 * 构建招聘方系统提示词（场景设置）
 */
export function buildEmployerSystemPrompt(
  job: {
    title: string;
    description: string;
    city: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    tags: string | null;
  },
  company: {
    name: string;
    city: string | null;
    intro: string | null;
  }
): string {
  const salaryText = job.salaryMin && job.salaryMax
    ? `${job.salaryCurrency === "USD" ? "$" : "¥"}${job.salaryMin.toLocaleString()} - ${job.salaryCurrency === "USD" ? "$" : "¥"}${job.salaryMax.toLocaleString()}`
    : job.salaryMin
    ? `${job.salaryCurrency === "USD" ? "$" : "¥"}${job.salaryMin.toLocaleString()}+`
    : "面议";

  return `你是 ${company.name} 的 HR，正在与候选人进行工作相关的对话，讨论 ${job.title} 职位。

职位信息：
- 职位名称：${job.title}
- 职位描述：${job.description.substring(0, 500)}${job.description.length > 500 ? "..." : ""}
- 工作城市：${job.city || "未指定"}
- 薪资范围：${salaryText}
- 标签：${job.tags || "无"}

公司信息：
- 公司名称：${company.name}
- 公司城市：${company.city || "未指定"}
- 公司简介：${company.intro || "无"}

对话目标：
1. 了解候选人的技能、经验和匹配度
2. 介绍职位和公司的优势
3. 回答候选人的问题
4. 评估候选人是否适合这个职位

对话规则：
- 保持专业，只讨论工作相关话题
- 不要聊兴趣爱好、日常生活等无关内容
- 提问要有针对性，评估候选人的能力
- 友好、专业地回应候选人的问题`;
}

/**
 * 构建招聘方对话提示词（保留用于向后兼容）
 * @deprecated 使用 buildEmployerSystemPrompt 替代
 */
export function buildEmployerPrompt(
  job: {
    title: string;
    description: string;
    city: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    tags: string | null;
  },
  company: {
    name: string;
    city: string | null;
    intro: string | null;
  }
): string {
  const systemPrompt = buildEmployerSystemPrompt(job, company);
  return `${systemPrompt}\n\n现在开始对话，请等待候选人先发言，然后回应并提问。`;
}

/**
 * 构建匹配度评估提示词
 */
export function buildEvaluationPrompt(
  candidateProfile: {
    name: string | null;
    title: string | null;
    city: string | null;
    yearsExp: number | null;
    skills: string | null;
    bio: string | null;
  },
  job: {
    title: string;
    description: string;
    city: string | null;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    tags: string | null;
  },
  company: {
    name: string;
  },
  conversationHistory: Array<{
    turn: number;
    role: "candidate" | "employer";
    content: string;
  }>
): string {
  const conversationText = conversationHistory
    .map((msg) => `${msg.role === "candidate" ? "候选人" : "招聘方"}（第${msg.turn}轮）：${msg.content}`)
    .join("\n\n");

  return `基于以下对话记录，评估候选人与职位的匹配度（0-100分）。

候选人资料：
- 姓名：${candidateProfile.name || "未填写"}
- 当前职位：${candidateProfile.title || "未填写"}
- 工作年限：${candidateProfile.yearsExp || 0} 年
- 技能：${candidateProfile.skills || "未填写"}
- 个人简介：${candidateProfile.bio || "未填写"}

职位信息：
- 职位名称：${job.title}
- 职位描述：${job.description.substring(0, 500)}
- 工作城市：${job.city || "未指定"}
- 薪资范围：${job.salaryMin && job.salaryMax ? `${job.salaryCurrency === "USD" ? "$" : "¥"}${job.salaryMin}-${job.salaryMax}` : "面议"}
- 标签：${job.tags || "无"}

公司：${company.name}

对话记录（5轮）：
${conversationText}

请只关注工作相关的匹配度，评估以下方面：
1. 技能匹配度
2. 工作经验匹配度
3. 职位要求匹配度
4. 沟通能力和专业度

返回 JSON 格式（只返回 JSON，不要其他文字）：
{
  "score": 75,
  "reason": "候选人技能匹配度高，工作经验符合要求，沟通专业",
  "strengths": ["技能匹配", "经验相关", "沟通专业"],
  "weaknesses": []
}`;
}

/**
 * 启动两个 SecondMe 用户的自动对话（基于场景）
 * 使用系统提示词让两个用户自动进行多轮对话
 * 
 * @param candidateToken 候选人的 accessToken
 * @param employerToken 招聘方的 accessToken
 * @param candidateSystemPrompt 候选人的系统提示词
 * @param employerSystemPrompt 招聘方的系统提示词
 * @param maxTurns 最大对话轮数（默认 5）
 * @param existingHistory 已有的对话历史（可选）
 * @param candidateConversationId 候选人的会话 ID（可选）
 * @param employerConversationId 招聘方的会话 ID（可选）
 * @returns 完整的对话历史和会话 ID
 */
export async function startAutoConversation(
  candidateToken: string,
  employerToken: string,
  candidateSystemPrompt: string,
  employerSystemPrompt: string,
  maxTurns: number = 5,
  existingHistory: Array<{ turn: number; role: "candidate" | "employer"; content: string }> = [],
  candidateConversationId?: string,
  employerConversationId?: string
): Promise<{
  conversationHistory: Array<{ turn: number; role: "candidate" | "employer"; content: string }>;
  candidateConversationId: string;
  employerConversationId: string | null;
}> {
  const conversationHistory = [...existingHistory];
  let currentCandidateConversationId = candidateConversationId || "";
  let currentEmployerConversationId = employerConversationId || null;

  // 第 1 轮：候选人先发言
  // 根据参考示例，使用 systemPrompt 参数和 sessionId
  if (conversationHistory.length === 0) {
    const initialMessage = "你好，我对这个职位很感兴趣，想了解一下详情。";
    const candidateResult = await callSecondMeChat(
      candidateToken,
      initialMessage,
      currentCandidateConversationId || undefined,
      candidateSystemPrompt // 使用 systemPrompt 参数
    );

    if (candidateResult.code !== 0 || !candidateResult.data) {
      throw new Error(candidateResult.message || "候选人对话失败");
    }

    const candidateMessage = candidateResult.data?.response || candidateResult.data?.message || candidateResult.data?.content || "";
    currentCandidateConversationId = candidateResult.data?.sessionId || candidateResult.data?.conversationId || currentCandidateConversationId;

    conversationHistory.push({
      turn: 1,
      role: "candidate",
      content: candidateMessage,
    });
  }

  // 后续轮次：交替对话（使用系统提示词和对方的上一条消息）
  let currentTurn = Math.max(...conversationHistory.map(m => m.turn), 0);

  while (currentTurn < maxTurns) {
    const lastMessage = conversationHistory[conversationHistory.length - 1];
    const nextTurn = currentTurn + 1;

    if (lastMessage.role === "candidate") {
      // 上一条是候选人的消息，现在招聘方回应
      // 根据参考示例，直接传递消息内容，systemPrompt 只在首次调用时传递
      const employerResult = await callSecondMeChat(
        employerToken,
        lastMessage.content,
        currentEmployerConversationId || undefined,
        currentEmployerConversationId ? undefined : employerSystemPrompt // 只在首次调用时传递 systemPrompt
      );

      if (employerResult.code !== 0 || !employerResult.data) {
        throw new Error(employerResult.message || "招聘方对话失败");
      }

      const employerResponseMessage = employerResult.data?.response || employerResult.data?.message || employerResult.data?.content || "";
      currentEmployerConversationId = employerResult.data?.sessionId || employerResult.data?.conversationId || currentEmployerConversationId;

      conversationHistory.push({
        turn: nextTurn,
        role: "employer",
        content: employerResponseMessage,
      });
    } else {
      // 上一条是招聘方的消息，现在候选人回应
      // 根据参考示例，直接传递消息内容，systemPrompt 只在首次调用时传递
      const candidateResult = await callSecondMeChat(
        candidateToken,
        lastMessage.content,
        currentCandidateConversationId || undefined,
        currentCandidateConversationId ? undefined : candidateSystemPrompt // 只在首次调用时传递 systemPrompt
      );

      if (candidateResult.code !== 0 || !candidateResult.data) {
        throw new Error(candidateResult.message || "候选人对话失败");
      }

      const candidateResponseMessage = candidateResult.data?.response || candidateResult.data?.message || candidateResult.data?.content || "";
      currentCandidateConversationId = candidateResult.data?.sessionId || candidateResult.data?.conversationId || currentCandidateConversationId;

      conversationHistory.push({
        turn: nextTurn,
        role: "candidate",
        content: candidateResponseMessage,
      });
    }

    currentTurn = nextTurn;
  }

  return {
    conversationHistory,
    candidateConversationId: currentCandidateConversationId,
    employerConversationId: currentEmployerConversationId,
  };
}

/**
 * 执行一轮对话（保留用于向后兼容）
 * @deprecated 使用 startAutoConversation 替代
 */
export async function executeConversationTurn(
  conversation: {
    id: string;
    currentTurn: number;
    candidateSecondMeUserId: string;
    employerSecondMeUserId: string;
    candidateConversationId: string | null;
    employerConversationId: string | null;
    conversationHistory: any;
  },
  candidateToken: string,
  employerToken: string,
  candidatePrompt: string,
  employerPrompt: string,
  jobTitle: string,
  companyName: string
): Promise<{
  candidateMessage: string;
  employerMessage: string | null;
  candidateConversationId: string;
  employerConversationId: string | null;
}> {
  const turn = conversation.currentTurn + 1;
  let candidateMessage = "";
  let employerMessage: string | null = null;
  let candidateConversationId = conversation.candidateConversationId || "";
  let employerConversationId = conversation.employerConversationId || null;

    // 第 1 轮：候选人先发言
    if (turn === 1) {
      const candidateResult = await callSecondMeChat(
        candidateToken,
        candidatePrompt,
        candidateConversationId || undefined,
        undefined // 向后兼容，不使用系统提示词
      );

    if (candidateResult.code !== 0 || !candidateResult.data) {
      throw new Error(candidateResult.message || "候选人对话失败");
    }

    candidateMessage = candidateResult.data.response || candidateResult.data.message || candidateResult.data.content || "";
    candidateConversationId = candidateResult.data.conversationId || candidateConversationId;
  } else if (turn === 2) {
    // 第 2 轮：招聘方回应并提问
    const previousCandidateMessage = conversation.conversationHistory.find(
      (msg: any) => msg.turn === 1 && msg.role === "candidate"
    )?.content || "";

    const message = `${employerPrompt}\n\n候选人刚才说：${previousCandidateMessage}\n\n请回应并提问，了解候选人的匹配度。`;

      const employerResult = await callSecondMeChat(
        employerToken,
        message,
        employerConversationId || undefined,
        undefined // 向后兼容，不使用系统提示词
      );

    if (employerResult.code !== 0 || !employerResult.data) {
      throw new Error(employerResult.message || "招聘方对话失败");
    }

    employerMessage = employerResult.data.response || employerResult.data.message || employerResult.data.content || "";
    employerConversationId = employerResult.data.conversationId || employerConversationId;
  } else {
    // 第 3-5 轮：交替对话
    if (turn % 2 === 1) {
      // 奇数轮（3, 5）：候选人发言
      const previousEmployerMessage = conversation.conversationHistory
        .filter((msg: any) => msg.role === "employer")
        .sort((a: any, b: any) => b.turn - a.turn)[0]?.content || "";

      const message = `${candidatePrompt}\n\n招聘方刚才说：${previousEmployerMessage}\n\n请回应并继续对话。`;

      const candidateResult = await callSecondMeChat(
        candidateToken,
        message,
        candidateConversationId || undefined,
        undefined // 向后兼容，不使用系统提示词
      );

      if (candidateResult.code !== 0 || !candidateResult.data) {
        throw new Error(candidateResult.message || "候选人对话失败");
      }

      candidateMessage = candidateResult.data.response || candidateResult.data.message || candidateResult.data.content || "";
      candidateConversationId = candidateResult.data.conversationId || candidateConversationId;
    } else {
      // 偶数轮（4）：招聘方发言
      const previousCandidateMessage = conversation.conversationHistory
        .filter((msg: any) => msg.role === "candidate")
        .sort((a: any, b: any) => b.turn - a.turn)[0]?.content || "";

      const message = `${employerPrompt}\n\n候选人刚才说：${previousCandidateMessage}\n\n请回应并继续对话。`;

      const employerResult = await callSecondMeChat(
        employerToken,
        message,
        employerConversationId || undefined,
        undefined // 向后兼容，不使用系统提示词
      );

      if (employerResult.code !== 0 || !employerResult.data) {
        throw new Error(employerResult.message || "招聘方对话失败");
      }

      employerMessage = employerResult.data.response || employerResult.data.message || employerResult.data.content || "";
      employerConversationId = employerResult.data.conversationId || employerConversationId;
    }
  }

  return {
    candidateMessage,
    employerMessage,
    candidateConversationId,
    employerConversationId,
  };
}

/**
 * 评估匹配度
 */
export async function evaluateMatchScore(
  candidateToken: string,
  evaluationPrompt: string
): Promise<{
  score: number;
  reason: string;
  strengths: string[];
  weaknesses: string[];
}> {
  const result = await callSecondMeChat(candidateToken, evaluationPrompt);

  if (result.code !== 0 || !result.data) {
    throw new Error(result.message || "评估失败");
  }

  const responseText = result.data.response || result.data.message || result.data.content || "";

  // 尝试解析 JSON
  let evaluation: {
    score: number;
    reason: string;
    strengths: string[];
    weaknesses: string[];
  };

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      evaluation = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("无法解析评估结果");
    }
  } catch (error) {
    console.error("解析评估结果失败:", error);
    // 降级方案
    evaluation = {
      score: 50,
      reason: "评估解析失败",
      strengths: [],
      weaknesses: [],
    };
  }

  return evaluation;
}
