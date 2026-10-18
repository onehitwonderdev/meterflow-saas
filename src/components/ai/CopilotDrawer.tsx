"use client";

import * as React from "react";
import { X, Send, Sparkles, Loader2, Copy, Check, AlertTriangle, BarChart, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  data?: {
    intent: string;
    summaryMarkdown: string;
    chartConfig?: { type: string; xAxisKey: string; yAxisKey: string };
    recommendedAction: string;
    generatedSql?: string;
  };
}

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}

const PROMPT_CHIPS = [
  { label: "Top customers by token usage", query: "Which 3 customers had the highest LLM token usage in the last 30 days?" },
  { label: "Pricing simulation", query: "Simulate revenue impact of lowering the free tier for llm_tokens from 1M to 250K tokens" },
  { label: "Anomaly explanation", query: "Explain the GPU seconds spike for TechCorp Industries yesterday" },
  { label: "Unpaid invoices", query: "Show me all unpaid invoices over $10,000" },
  { label: "Churned customers", query: "List all churned customers from the last quarter with their final spend" },
  { label: "Revenue projection", query: "Project MRR for next quarter based on current growth trends" },
];

export function CopilotDrawer({ isOpen, onClose, orgId }: CopilotDrawerProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showChips, setShowChips] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setShowChips(false);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage], orgId }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.summaryMarkdown || "I'll help you with that.",
        timestamp: new Date(),
        data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Copilot error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderMarkdown = (markdown: string) => {
    // Simple markdown rendering for our use case
    return (
      <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
        {markdown.split("\n").map((line, i) => {
          if (line.startsWith("## ")) {
            return <h3 key={i} className="text-lg font-semibold text-white mt-4 mb-2">{line.slice(3)}</h3>;
          }
          if (line.startsWith("### ")) {
            return <h4 key={i} className="text-base font-medium text-white mt-3 mb-1">{line.slice(4)}</h4>;
          }
          if (line.startsWith("|")) {
            // Table row - simplified rendering
            return <div key={i} className="font-mono text-xs text-zinc-400">{line}</div>;
          }
          if (line.startsWith("- ") || line.startsWith("* ")) {
            return <li key={i} className="ml-4 mb-1">{line.slice(2)}</li>;
          }
          if (line.trim() === "") {
            return <br key={i} />;
          }
          return <p key={i} className="mb-2">{line}</p>;
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Brain className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">FinOps Copilot</h2>
              <p className="text-xs text-zinc-400">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 space-y-4">
          {messages.length === 0 && showChips && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm">Ask me anything about your usage, billing, or anomalies.</p>
              <div className="flex flex-wrap gap-2">
                {PROMPT_CHIPS.map((chip, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="h-auto px-3 py-2 text-left w-full sm:w-auto"
                    onClick={() => {
                      setInput(chip.query);
                      handleSend();
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-1.5 text-emerald-400" />
                    {chip.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-emerald-500/20 border border-emerald-500/30 text-white"
                    : "bg-zinc-800/50 border border-zinc-700"
                )}
              >
                {message.role === "assistant" && message.data ? (
                  <>
                    <div className="mb-2">{renderMarkdown(message.content)}</div>
                    {message.data.chartConfig && (
                      <Badge variant="outline" className="mb-2 gap-1 text-xs">
                        <BarChart className="h-3 w-3" />
                        Chart: {message.data.chartConfig.type} ({message.data.chartConfig.xAxisKey} vs {message.data.chartConfig.yAxisKey})
                      </Badge>
                    )}
                    {message.data.recommendedAction && (
                      <div className="mt-3 p-3 bg-zinc-900/50 border border-zinc-700 rounded-lg">
                        <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
                          <Zap className="h-3 w-3" />
                          Recommended Action
                        </div>
                        <p className="text-sm text-zinc-300">{message.data.recommendedAction}</p>
                      </div>
                    )}
                    {message.data.generatedSql && (
                      <details className="mt-3">
                        <summary className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                          <AlertTriangle className="h-3 w-3" />
                          Generated SQL (read-only)
                        </summary>
                        <div className="mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg relative">
                          <pre className="text-xs text-emerald-300 font-mono overflow-x-auto">{message.data!.generatedSql}</pre>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 text-zinc-500 hover:text-zinc-300"
                            onClick={() => copyToClipboard(message.data!.generatedSql!)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </details>
                    )}
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
                <p className={cn("text-xs mt-1", message.role === "user" ? "text-emerald-300/70" : "text-zinc-500")}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Brain className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
                    <span className="text-zinc-400">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>

        <Separator className="mx-4" />

        {/* Input */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about usage, pricing, anomalies..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="lg">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-500 mt-2 text-center">
            Data stays in your org. SQL runs in read-only transactions with 2s timeout.
          </p>
        </div>
      </div>
    </>
  );
}