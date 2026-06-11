import type { ComponentType } from "react";
import { FPS, H, W } from "@/lib/customizer-config";
import {
  SignupFlowExampleScene,
  signupFlowExampleCode,
} from "../signup-flow-example";
import {
  AiPromptFlowExampleScene,
  aiPromptFlowExampleCode,
} from "../ai-prompt-flow-example";
import {
  CheckoutFlowExampleScene,
  checkoutFlowExampleCode,
} from "../checkout-flow-example";
import {
  OnboardingStepperFlowExampleScene,
  onboardingStepperFlowExampleCode,
} from "../onboarding-stepper-flow-example";
import {
  SettingsToggleFlowExampleScene,
  settingsToggleFlowExampleCode,
} from "../settings-toggle-flow-example";

/**
 * Blocks scene registry — parallel to the ui-tier `examples` map
 * (`components/docs/examples/index.tsx`), but for composition blocks. Keyed by
 * the `<name>-flow` scene key, each entry pairs a Remotion scene component with
 * its copyable install-path code string and the timing the Player runs at.
 *
 * Unlike `ExampleEntry`, there is no customizer here: blocks are controls-free,
 * so `code` is the finished scene snippet (string or a zero-arg function that
 * returns one), never a per-honored-prop template.
 *
 * The 5 scenes are registered later in the Wiring task — this map starts EMPTY.
 */
export interface BlockExampleEntry {
  Component: ComponentType;
  /**
   * The copyable scene snippet. Blocks have no honored controls, so this is the
   * finished code — a plain string, or a zero-arg function returning one
   * (mirrors the `<name>FlowExampleCode` callable shape) so either form works.
   */
  code: string | ((values?: Record<string, unknown>) => string);
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

export const blockExamples: Record<string, BlockExampleEntry> = {
  "signup-flow": {
    Component: SignupFlowExampleScene,
    code: signupFlowExampleCode,
    // Toast dismiss 300 + 14 + ~16 settle (signup card fill → submit → toast).
    durationInFrames: 330,
    fps: FPS,
    width: W,
    height: H,
  },
  "ai-prompt-flow": {
    Component: AiPromptFlowExampleScene,
    code: aiPromptFlowExampleCode,
    // Toast dismiss 220 + ~10 settle (US-B002).
    durationInFrames: 230,
    fps: FPS,
    width: W,
    height: H,
  },
  "checkout-flow": {
    Component: CheckoutFlowExampleScene,
    code: checkoutFlowExampleCode,
    // Final beat 235 + ~10 settle (US-B003).
    durationInFrames: 245,
    fps: FPS,
    width: W,
    height: H,
  },
  "onboarding-stepper-flow": {
    Component: OnboardingStepperFlowExampleScene,
    code: onboardingStepperFlowExampleCode,
    // Success 156 + ~20 final ease/settle (US-B004).
    durationInFrames: 175,
    fps: FPS,
    width: W,
    height: H,
  },
  "settings-toggle-flow": {
    Component: SettingsToggleFlowExampleScene,
    code: settingsToggleFlowExampleCode,
    // Final beat 215 + ~10 settle (US-B005).
    durationInFrames: 225,
    fps: FPS,
    width: W,
    height: H,
  },
};

/**
 * Parallel meta lookup mirroring `UI_SCENE_META` usage in
 * `ui-component-preview.tsx`, keyed by `<name>-flow`. Minimal by design — blocks
 * expose no honored controls, so this only carries the scene's code emitter for
 * any caller that wants the snippet without instantiating the Player. Starts
 * EMPTY; populated alongside `blockExamples` in the Wiring task.
 */
export const BLOCK_SCENE_META: Record<
  string,
  { code: string | ((values?: Record<string, unknown>) => string) }
> = {
  "signup-flow": { code: signupFlowExampleCode },
  "ai-prompt-flow": { code: aiPromptFlowExampleCode },
  "checkout-flow": { code: checkoutFlowExampleCode },
  "onboarding-stepper-flow": { code: onboardingStepperFlowExampleCode },
  "settings-toggle-flow": { code: settingsToggleFlowExampleCode },
};

// Re-export so block entries can reference the shared timing constants without
// reaching back into customizer-config from every scene file.
export { FPS, H, W };
