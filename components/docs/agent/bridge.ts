"use client";

import {
  type AgentAction,
  createAgent,
  registerTools,
} from "@ui-sdk/react/agent";

/**
 * The panel's buttons that write to the clipboard or leave the page are a
 * person's to press; an agent may change values, open groups and reset.
 */
export function allowStep(
  step: Pick<AgentAction, "component" | "label">,
): boolean {
  return step.component !== "button" || step.label === "Reset";
}

let agent: ReturnType<typeof createAgent> | undefined;

export function connectAgent(): () => void {
  agent ??= createAgent({ allow: allowStep });
  if (process.env.NODE_ENV === "development") {
    (window as unknown as { remocnAgent: typeof agent }).remocnAgent = agent;
  }
  // The bridge's allow already decides each step; asking again here would
  // only repeat it.
  return registerTools(agent, { allow: () => true });
}
