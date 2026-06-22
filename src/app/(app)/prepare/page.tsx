import { redirect } from "next/navigation";

import { isMatchPrepEnabled } from "@/lib/app-phase";

/**
 * Match preparation (Phase 5+): opponent + date → LLM advice with knowledge-base context.
 * Hidden during Phase 4 — see docs/DEVELOPMENT_PLAN.md.
 */
export default function PreparePage() {
  if (!isMatchPrepEnabled()) {
    redirect("/dashboard");
  }

  redirect("/dashboard");
}
