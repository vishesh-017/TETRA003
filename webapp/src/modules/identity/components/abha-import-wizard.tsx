import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, Shield } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useIdentityMutations } from "@/modules/identity/hooks";
import type { HealthRecordRow } from "@/modules/identity/types";

type Step = "enter" | "consent" | "loading" | "done";

export function AbhaImportWizard({
  open,
  onClose,
  defaultAbha,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  defaultAbha?: string | null;
  onImported?: (records: HealthRecordRow[]) => void;
}) {
  const { importAbha } = useIdentityMutations();
  const [step, setStep] = useState<Step>("enter");
  const [abhaId, setAbhaId] = useState(defaultAbha || "12-3456-7890-0201");
  const [imported, setImported] = useState<HealthRecordRow[]>([]);

  const reset = () => {
    setStep("enter");
    setImported([]);
  };

  const close = () => {
    reset();
    onClose();
  };

  const runImport = async () => {
    setStep("loading");
    try {
      const result = await importAbha.mutateAsync(abhaId);
      setImported(result.records);
      setStep("done");
      onImported?.(result.records);
    } catch {
      setStep("consent");
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/40 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
            className="glass-panel w-full max-w-lg rounded-[1.75rem] p-6 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.14em]">
                Import via ABHA
              </p>
            </div>
            <h3 className="mt-2 font-display text-2xl font-semibold">
              ABDM-compatible live import
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Not a live NHA connection — structured for future ABDM APIs.
            </p>

            {step === "enter" ? (
              <div className="mt-5 space-y-4">
                <label className="block space-y-1.5 text-sm">
                  <span className="text-muted-foreground">Live ABHA ID</span>
                  <input
                    value={abhaId}
                    onChange={(e) => setAbhaId(e.target.value)}
                    className="flex h-11 w-full rounded-2xl border border-input bg-background px-3"
                    placeholder="12-3456-7890-0201"
                  />
                </label>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={close}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setStep("consent")}
                    disabled={abhaId.trim().length < 8}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : null}

            {step === "consent" ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-border bg-background/70 p-4 text-sm leading-relaxed text-muted-foreground">
                  By continuing, you consent to import <strong>live</strong>{" "}
                  health records linked to ABHA <strong>{abhaId}</strong> into
                  your HealNexus passport. No real government data is accessed.
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("enter")}
                  >
                    Back
                  </Button>
                  <Button className="flex-1" onClick={() => void runImport()}>
                    I consent — Import
                  </Button>
                </div>
              </div>
            ) : null}

            {step === "loading" ? (
              <div className="mt-8 flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-medium">Fetching ABHA live records…</p>
                <p className="text-sm text-muted-foreground">
                  Linking prescriptions, labs, and visits
                </p>
              </div>
            ) : null}

            {step === "done" ? (
              <div className="mt-5 space-y-4">
                <div className="flex items-center gap-2 text-secondary">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">
                    {imported.length} records imported
                  </p>
                </div>
                <ul className="max-h-48 space-y-2 overflow-auto text-sm">
                  {imported.slice(0, 8).map((r) => (
                    <li
                      key={r.id}
                      className="rounded-xl border border-border px-3 py-2"
                    >
                      <span className="capitalize text-muted-foreground">
                        {r.category.replaceAll("_", " ")}
                      </span>
                      <p className="font-medium">{r.title}</p>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={close}>
                  View in passport
                </Button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
