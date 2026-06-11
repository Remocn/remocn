"use client";

import { SignupFlow } from "@/registry/remocn-ui/signup-flow";

/**
 * Fixed lifecycle demo for the `signup-flow` block: a signup card whose cursor
 * fills each labeled field top-to-bottom (Full Name → Email → Password →
 * Confirm), then clicks "Create account" (hover → press → loading → success),
 * and a success toast slides in. The block is a pure orchestrator — every
 * channel comes from a composed primitive's hook.
 *
 * Timeline: cursor click ≡ field active at 18 / 52 / 96 / 134; Create hover 176
 * ≡ cursor click 176 → press 186 → loading 192 → success 234 ≡ toast enter 234;
 * toast dismiss 300. durationInFrames 330 (314 + ~16 settle).
 */
export const SignupFlowExampleScene = () => <SignupFlow />;

export const signupFlowExampleCode = (): string => {
  return `import { SignupFlow } from "@/components/remocn/signup-flow";

export const Scene = () => <SignupFlow />;`;
};
