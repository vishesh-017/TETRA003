import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TodayTask } from "@/modules/patient/types";

export function TaskRow({
  task,
  onComplete,
  onSkip,
  busy,
}: {
  task: TodayTask;
  onComplete: () => void;
  onSkip: () => void;
  busy?: boolean;
}) {
  const done = task.status === "completed";
  const skipped = task.status === "skipped";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/80 bg-card px-3 py-3 shadow-soft",
        done && "border-secondary/40 bg-secondary/5",
        skipped && "opacity-60",
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm",
          done
            ? "border-secondary bg-secondary text-secondary-foreground"
            : skipped
              ? "border-muted-foreground/30 text-muted-foreground"
              : "border-primary/30 text-primary",
        )}
      >
        {done ? <Check className="h-4 w-4" /> : skipped ? <X className="h-4 w-4" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", done && "line-through decoration-secondary/50")}>
          {task.title}
        </p>
        {task.description ? (
          <p className="truncate text-xs text-muted-foreground">{task.description}</p>
        ) : null}
      </div>
      {task.status === "pending" ? (
        <div className="flex shrink-0 gap-1">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={onComplete}
            aria-label={`Complete ${task.title}`}
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={onSkip}
            aria-label={`Skip ${task.title}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
}
