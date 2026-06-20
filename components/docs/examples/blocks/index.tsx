import type { ComponentType } from "react";
import { FPS, H, W } from "@/lib/customizer-config";
import type { BackdropFill } from "@/registry/remocn/backdrop";
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
import {
  BackdropColorScene,
  BackdropGradientScene,
  BackdropImageScene,
  BackdropLiveScene,
  backdropColorCode,
  backdropGradientCode,
  backdropImageCode,
  backdropLiveCode,
} from "../backdrop-variants";
import {
  RollingNumberConfettiExampleScene,
  rollingNumberConfettiExampleCode,
} from "../rolling-number-confetti-example";

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
  previewBackdrop?: BackdropFill;
}

export const blockExamples: Record<string, BlockExampleEntry> = {
  "signup-flow": {
    Component: SignupFlowExampleScene,
    code: signupFlowExampleCode,
    // blur-in entrance (card → header → fields → button, ~0–64) → cursor demo
    // (+DEMO 48) → toast dismiss 348 + 14 + ~18 settle.
    durationInFrames: 380,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(0.97 0 0)" },
  },
  "ai-prompt-flow": {
    Component: AiPromptFlowExampleScene,
    code: aiPromptFlowExampleCode,
    // Toast dismiss 220 + ~10 settle (US-B002).
    durationInFrames: 230,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "checkout-flow": {
    Component: CheckoutFlowExampleScene,
    code: checkoutFlowExampleCode,
    // blur-in entrance (card → header → toggle → fields → Pay, ~0–58) → cursor
    // demo (toggle 64 → card 96 → terms 150 → Pay 180) → toast dismiss 286 + ~34.
    durationInFrames: 320,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(0.97 0 0)" },
  },
  "onboarding-stepper-flow": {
    Component: OnboardingStepperFlowExampleScene,
    code: onboardingStepperFlowExampleCode,
    // Success 156 + ~20 final ease/settle (US-B004).
    durationInFrames: 175,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "settings-toggle-flow": {
    Component: SettingsToggleFlowExampleScene,
    code: settingsToggleFlowExampleCode,
    // blur-in entrance (card → header → controls, ~0–58) → cursor demo (+DEMO
    // 44): switch 68 → select 99/124 → slider 149–202 → Save click 224 → toast
    // 240–300 dismiss + ~20 settle.
    durationInFrames: 320,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(0.97 0 0)" },
  },
  "backdrop-color": {
    Component: BackdropColorScene,
    code: backdropColorCode,
    durationInFrames: 90,
    fps: FPS,
    width: W,
    height: H,
  },
  "backdrop-gradient": {
    Component: BackdropGradientScene,
    code: backdropGradientCode,
    durationInFrames: 90,
    fps: FPS,
    width: W,
    height: H,
  },
  "backdrop-image": {
    Component: BackdropImageScene,
    code: backdropImageCode,
    durationInFrames: 90,
    fps: FPS,
    width: W,
    height: H,
  },
  "backdrop-live": {
    Component: BackdropLiveScene,
    code: backdropLiveCode,
    durationInFrames: 150,
    fps: FPS,
    width: W,
    height: H,
  },
  "rolling-number-confetti": {
    Component: RollingNumberConfettiExampleScene,
    code: rollingNumberConfettiExampleCode,
    durationInFrames: 210,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "#ffffff" },
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
  "backdrop-color": { code: backdropColorCode },
  "backdrop-gradient": { code: backdropGradientCode },
  "backdrop-image": { code: backdropImageCode },
  "backdrop-live": { code: backdropLiveCode },
  "rolling-number-confetti": { code: rollingNumberConfettiExampleCode },
};

// Re-export so block entries can reference the shared timing constants without
// reaching back into customizer-config from every scene file.
export { FPS, H, W };
