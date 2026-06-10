import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Eraser,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  StopCircle,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { Markdown } from "@/components/markdown";
import { AiDisclaimer } from "@/components/disclaimer";
import { bumpStat } from "@/lib/storage";

export const Route = createFileRoute("/tutor")({
  head: () => ({
    meta: [
      { title: "AI Tutor Chat · StudySphere AI" },
      {
        name: "description",
        content: "Chat with your AI study coach, tutor, and exam prep assistant.",
      },
    ],
  }),
  component: TutorPage,
});

const STORAGE_KEY = "studysphere.tutor.messages";

const SUGGESTIONS = [
  "Explain photosynthesis simply",
  "Help me prepare for matric exams",
  "Create a 1-week study schedule",
  "Summarize the French Revolution",
  "Generate 5 practice questions on trigonometry",
];

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function TutorPage() {
  const initial = useMemo(loadMessages, []);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: "studysphere-tutor",
    messages: initial,
    transport,
    onError: (err) => toast.error(err.message || "Chat error"),
    onFinish: () => bumpStat({ studyMinutes: 5 }),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore */
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || isLoading) return;
    setInput("");
    await sendMessage({ text: value });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  function clearChat() {
    setMessages([]);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-5xl flex-col gap-4">
      <PageHeader
        title="AI Tutor Chat"
        subtitle="Your always-on academic mentor. Ask anything — concepts, plans, practice questions."
        icon={<MessageSquareText className="size-5" />}
        actions={
          messages.length > 0 ? (
            <Button variant="outline" size="sm" onClick={clearChat}>
              <Eraser className="size-4" /> New conversation
            </Button>
          ) : undefined
        }
      />

      <Card className="flex min-h-0 flex-1 flex-col shadow-card">
        <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-md space-y-6 py-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="size-7" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Hi! I'm your StudySphere tutor.</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask me anything — I'll explain, plan, and quiz you.
                </p>
              </div>
              <div className="grid gap-2 text-left">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("");
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      m.role === "user" ? "bg-secondary" : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {m.role === "user" ? (
                      <User className="size-4" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[85%] ${
                      m.role === "user"
                        ? "rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-primary-foreground"
                        : ""
                    }`}
                  >
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap text-sm">{text}</p>
                    ) : (
                      <Markdown>{text || "…"}</Markdown>
                    )}
                  </div>
                </div>
              );
            })
          )}
          {status === "submitted" && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Thinking…
              </div>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t bg-background p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask your tutor anything…"
              className="min-h-[44px] resize-none"
              disabled={isLoading}
            />
            {isLoading ? (
              <Button type="button" variant="outline" size="icon" onClick={() => stop()}>
                <StopCircle className="size-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </form>
      </Card>

      <AiDisclaimer compact />
    </div>
  );
}
