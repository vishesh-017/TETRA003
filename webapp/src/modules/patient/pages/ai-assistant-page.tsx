import { useState } from "react";
import { motion } from "framer-motion";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  askHealthAssistant,
  isAiServiceConfigured,
} from "@/services/ai.service";

interface ChatItem {
  role: "user" | "assistant";
  content: string;
}

export function AiAssistantPage() {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm your AI Health Assistant. I can explain recovery tips from your care plan. I never diagnose or prescribe.",
    },
  ]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const result = await askHealthAssistant([
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ]);
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
          content: `${result.summary}${points}${contact}\n\n_${result.disclaimer}_`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">AI Health Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isAiServiceConfigured()
            ? "Connected to HealNexus AI service (Exa stays server-side)."
            : "Set VITE_AI_API_BASE_URL to http://127.0.0.1:8001 and run ai-service."}
        </p>
      </div>
      <AiDisclaimer />

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
            placeholder="Ask about hydration, walking, or your care plan…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button onClick={send} disabled={busy || !input.trim()}>
            {busy ? "Thinking…" : "Send"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
