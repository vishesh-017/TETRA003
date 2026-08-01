import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bot, FlaskConical } from "lucide-react";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { subscribeStore } from "@/data/store";
import { cn } from "@/lib/utils";
import {
  askGroundedAssistant,
  greetingFromLive,
} from "@/modules/ai-support/chat-engine";
import { runAiCheckup } from "@/modules/ai-support/checkup-engine";

interface ChatItem {
  role: "user" | "assistant";
  content: string;
}

const PROMPTS = [
  "What is my current risk?",
  "Which labs am I missing?",
  "Any warning signs?",
  "Should I see a specialist?",
  "Explain my medicines",
];

export function AiAssistantPage() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([]);

  useEffect(() => subscribeStore(() => setTick((t) => t + 1)), []);

  const checkup = useMemo(
    () => (user?.id ? runAiCheckup(user.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, tick],
  );

  useEffect(() => {
    if (!user?.id) return;
    setMessages([
      {
        role: "assistant",
        content: greetingFromLive(user.id),
      },
    ]);
  }, [user?.id]);

  const send = async (textIn?: string) => {
    const text = (textIn ?? input).trim();
    if (!text || busy || !user?.id) return;
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
      const points = result.key_points?.length
        ? `\n\nKey points:\n- ${result.key_points.join("\n- ")}`
        : "";
      const contact = result.when_to_contact_doctor?.length
        ? `\n\nWhen to contact a doctor:\n- ${result.when_to_contact_doctor.join("\n- ")}`
        : "";
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `${result.summary}${points}${contact}\n\n_${result.disclaimer}_\n(${result.provider})`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-10">
      <div>
        <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Bot className="h-4 w-4" />
          Grounded support assistant
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          AI Health Assistant
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Answers from your live vitals, medicines, labs, care plan, and risk
          scores — for early lifestyle-disease risk support, not diagnosis.
        </p>
        {checkup ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Live: risk {checkup.overall_risk} · recovery {checkup.recovery_score} ·{" "}
            {checkup.missing_investigations.length} missing lab suggestion(s)
          </p>
        ) : null}
      </div>
      <AiDisclaimer />

      <div className="flex flex-wrap gap-2">
        <Link
          to="/patient/ai-checkup"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          <FlaskConical className="mr-1 h-3.5 w-3.5" />
          Open AI Checkup
        </Link>
        {PROMPTS.map((p) => (
          <Button
            key={p}
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => void send(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      <Card className="min-h-[420px]">
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {messages.map((m, i) => (
              <motion.div
                key={`${m.role}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {m.content}
              </motion.div>
            ))}
          </div>
          <Textarea
            rows={3}
            placeholder="Ask about risk, missing labs, medicines, warning signs…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button onClick={() => void send()} disabled={busy || !input.trim()}>
            {busy ? "Thinking…" : "Send"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
