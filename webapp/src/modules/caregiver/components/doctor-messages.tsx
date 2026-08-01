import { motion } from "framer-motion";
import { Stethoscope } from "lucide-react";

import type { DoctorMessage } from "@/modules/caregiver/types";

export function DoctorMessages({ messages }: { messages: DoctorMessage[] }) {
  const message = messages[0];
  if (!message) return null;

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-teal-50/40 p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <Stethoscope className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">{message.doctorName}</p>
          <p className="text-xs text-muted-foreground">
            {message.specialty} · {message.sentAt}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {message.paragraphs.map((line, i) => (
          <motion.div
            key={line}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
            className="max-w-[95%] rounded-2xl rounded-tl-md bg-white px-4 py-3 text-sm leading-relaxed text-foreground shadow-sm ring-1 ring-sky-100/80"
          >
            {line}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
