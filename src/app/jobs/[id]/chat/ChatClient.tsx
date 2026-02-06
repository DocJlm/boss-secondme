"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatClientProps {
  jobId: string;
  jobTitle: string;
}

export function ChatClient({ jobId, jobTitle }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化欢迎消息
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `你好！我是 AI HR 助手。关于「${jobTitle}」这个职位，有什么问题想了解的吗？`,
        timestamp: new Date(),
      },
    ]);
  }, [jobTitle]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // 构建包含职位信息的 prompt
    const prompt = `你是一个专业的 HR 助手，正在帮助候选人了解「${jobTitle}」这个职位。

候选人的问题：${input}

请以专业、友好的方式回答候选人的问题。如果问题与职位相关，请提供详细的信息。如果问题不相关，可以礼貌地引导话题回到职位相关的内容。`;

    try {
      // 尝试使用流式响应
      const response = await fetch("/api/secondme/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("流式响应失败，尝试普通响应");
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("无法获取流式响应");
      }

      // 创建一条新的 assistant 消息，但先不添加到列表
      const assistantMessageId = (Date.now() + 1).toString();
      let assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      // 先添加一条空消息
      setMessages((prev) => [...prev, assistantMessage]);

      let done = false;
      let buffer = "";
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data && data !== "[DONE]") {
                try {
                  const parsed = JSON.parse(data);
                  let chunk = "";
                  // 处理 OpenAI 兼容格式: choices[0].delta.content
                  if (parsed.choices?.[0]?.delta?.content) {
                    chunk = parsed.choices[0].delta.content;
                  } else if (parsed.content) {
                    chunk = parsed.content;
                  } else if (parsed.delta) {
                    chunk = parsed.delta;
                  }
                  
                  if (chunk) {
                    assistantMessage.content += chunk;
                    // 更新最后一条 assistant 消息
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastMsg = updated[updated.length - 1];
                      if (lastMsg && lastMsg.id === assistantMessageId && lastMsg.role === "assistant") {
                        lastMsg.content = assistantMessage.content;
                      }
                      return updated;
                    });
                  }
                } catch (e) {
                  // 如果不是 JSON，忽略（可能是跨 chunk 的数据）
                }
              }
            } else if (line.trim() && !line.startsWith(":") && !line.startsWith("event:")) {
              // 直接文本内容（非 SSE 格式）
              assistantMessage.content += line;
              setMessages((prev) => {
                const updated = [...prev];
                const lastMsg = updated[updated.length - 1];
                if (lastMsg && lastMsg.id === assistantMessageId && lastMsg.role === "assistant") {
                  lastMsg.content = assistantMessage.content;
                }
                return updated;
              });
            }
          }
        }
      }
      
      // 处理剩余的 buffer
      if (buffer.trim()) {
        const line = buffer.trim();
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data && data !== "[DONE]") {
            try {
              const parsed = JSON.parse(data);
              let chunk = "";
              if (parsed.choices?.[0]?.delta?.content) {
                chunk = parsed.choices[0].delta.content;
              } else if (parsed.content) {
                chunk = parsed.content;
              }
              if (chunk) {
                assistantMessage.content += chunk;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastMsg = updated[updated.length - 1];
                  if (lastMsg && lastMsg.id === assistantMessageId && lastMsg.role === "assistant") {
                    lastMsg.content = assistantMessage.content;
                  }
                  return updated;
                });
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (streamError) {
      console.error("流式响应失败，尝试普通响应:", streamError);
      // 降级到普通响应
      try {
        const response = await fetch("/api/secondme/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: prompt,
          }),
        });

        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.message || "获取回复失败");
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.data?.response || result.data?.message || "抱歉，我无法理解你的问题。",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error: any) {
        console.error("获取回复失败:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "抱歉，获取回复时出现错误，请稍后重试。",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-slate-50 rounded-lg">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-900 border border-slate-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === "user" ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {message.timestamp.toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-slate-900 border border-slate-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="输入你的问题..."
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>
    </div>
  );
}
