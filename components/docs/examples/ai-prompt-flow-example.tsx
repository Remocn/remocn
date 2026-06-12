"use client";

import { AiPromptFlow } from "@/registry/remocn-ui/ai-prompt-flow";

/**
 * Fixed lifecycle demo for the `ai-prompt-flow` block: a prompt types into the
 * field, the Generate button runs hover → press → loading, the answer panel
 * reveals a skeleton shimmer, then crossfades into the generated answer, and a
 * ready toast slides in. The block is a pure orchestrator — every channel comes
 * from a composed primitive's hook; the shimmer is owned by `skeleton-block`.
 *
 * Timeline (US-B002 beat table): typing 0→50; button hover 52 → press 58 →
 * loading 62; skeleton loading 64; shimmer sweep 64→150; skeleton loaded 150
 * (opacities sum to 1, no box jump); toast enter 160; toast dismiss 220.
 * durationInFrames 230 (220 + ~10 settle).
 */
export const AiPromptFlowExampleScene = () => <AiPromptFlow />;

export const aiPromptFlowExampleCode = (): string => {
  return `import { AiPromptFlow } from "@/components/remocn/ai-prompt-flow";

export const Scene = () => <AiPromptFlow />;`;
};
