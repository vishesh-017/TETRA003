import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, MessageCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { subscribeStore } from "@/data/store";
import {
  askGroundedAssistant,
  greetingFromLive,
} from "@/modules/ai-support/chat-engine";
import { runAiCheckup } from "@/modules/ai-support/checkup-engine";
import { cn } from "@/lib/utils";

export function FloatingAiChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  useEffect(() => subscribeStore(() => setTick((t) => t + 1)), []);

  const checkup = useMemo(
    () => (user?.role === "patient" && user.id ? runAiCheckup(user.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, user?.role, tick],
  );

  useEffect(() => {
    if (!open || !user?.id || user.role !== "patient") return;
    if (messages.length) return;
    setMessages([{ role: "assistant", content: greetingFromLive(user.id) }]);
  }, [open, user?.id, user?.role, messages.length]);

  if (!user || user.role !== "patient") return null;

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const result = await askGroundedAssistant(
        [
          ...messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: text },
        ],
        user.id,
      );
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `${result.summary}${
            result.key_points?.length
              ? `\n\n• ${result.key_points.slice(0, 4).join("\n• ")}`
              : ""
          }`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="pointer-events-auto flex h-[min(520px,70dvh)] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#0F4C5C] to-[#0F766E] px-4 py-3 text-white">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Bot className="h-4 w-4" />
                AI Support
              </p>
              <p className="text-[11px] text-white/70">
                {checkup
                  ? `Live risk ${checkup.overall_risk} · Recovery ${checkup.recovery_score} · DB linked`
                  : "HealNexus database linked"}
              </p>
            </div>
            <button
              type="button"
              className="rounded-full p-1 hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={cn(
                  "max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2",
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted",
                )}
              >
                {m.content}
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-border p-3">
            <div className="flex flex-wrap gap-1.5">
              <Link
                to="/patient/ai-checkup"
                className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium"
                onClick={() => setOpen(false)}
              >
                AI Checkup
              </Link>
              <Link
                to="/patient/ai-assistant"
                className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium"
                onClick={() => setOpen(false)}
              >
                Full chat
              </Link>
            </div>
            <Textarea
              rows={2}
              placeholder="Ask about risk, labs, warnings…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <Button
              size="sm"
              className="w-full"
              disabled={busy || !input.trim()}
              onClick={() => void send()}
            >
              {busy ? "Thinking…" : "Send"}
            </Button>
          </div>
        </div>
      ) : null}

      <Button
        size="icon"
        className="pointer-events-auto h-14 w-14 rounded-full bg-[#0F766E] shadow-lg hover:bg-[#0F5F5A]"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI support chat"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
    </div>
  );
}
