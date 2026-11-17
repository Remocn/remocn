"use client";

import {
  type AgentAction,
  createAgent,
  registerTools,
} from "@ui-sdk/react/agent";

const AGENT_BUTTONS = new Set(["Reset", "Undo", "Redo"]);

/** A colour control's way back to its theme colour (`Accent: auto`). */
const AUTO_COLOR = /: auto$/;

/**
 * The panel's buttons that write to the clipboard or leave the page are a
 * person's to press; an agent may change values, open groups, step through
 * the history, reset, and set a colour back to auto.
 */
export function allowStep(
  step: Pick<AgentAction, "component" | "label">,
): boolean {
  const label = step.label ?? "";
  return (
    step.component !== "button" ||
    AGENT_BUTTONS.has(label) ||
    AUTO_COLOR.test(label)
  );
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
