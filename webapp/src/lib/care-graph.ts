import type { QueryClient } from "@tanstack/react-query";

/**
 * Invalidate every consumer of shared HealNexus store state so doctor,
 * patient, caregiver, investigations, identity, and analytics stay in sync.
 */
export async function invalidateCareGraph(
  qc: QueryClient,
  opts?: { patientId?: string },
) {
  const jobs: Array<Promise<unknown>> = [
    qc.invalidateQueries({ queryKey: ["patient"] }),
    qc.invalidateQueries({ queryKey: ["caregiver"] }),
    qc.invalidateQueries({ queryKey: ["doctor"] }),
    qc.invalidateQueries({ queryKey: ["patients"] }),
    qc.invalidateQueries({ queryKey: ["investigations"] }),
    qc.invalidateQueries({ queryKey: ["identity"] }),
    qc.invalidateQueries({ queryKey: ["analytics"] }),
    qc.invalidateQueries({ queryKey: ["notifications"] }),
  ];
  if (opts?.patientId) {
    jobs.push(
      qc.invalidateQueries({ queryKey: ["patients", opts.patientId] }),
      qc.invalidateQueries({
        queryKey: ["identity", "timeline", opts.patientId],
      }),
      qc.invalidateQueries({
        queryKey: ["identity", "passport", opts.patientId],
      }),
    );
  }
  await Promise.all(jobs);
}
