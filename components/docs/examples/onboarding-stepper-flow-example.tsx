"use client";

import { OnboardingStepperFlow } from "@/registry/remocn-ui/onboarding-stepper-flow";

/**
 * Fixed lifecycle demo for the `onboarding-stepper-flow` block: a Stepper rail
 * advances through three steps while the content crossfades — step 1 types an
 * email, step 2 checks a plan radio, step 3 flips a settings switch — and the
 * Finish button resolves to success. Navigation is button-driven (no cursor).
 * The block is a pure orchestrator; the only block-owned motion is the panel
 * crossfade, a §0B.3-sanctioned LINEAR read of the stepper's exposed `position`.
 *
 * Timeline (US-B004 beat table): step 1 typing 10→55; Next press 60 → stepper
 * advance 64; plan radio 90; Next press 100 → stepper advance 104; switch 130;
 * Finish press 150 → success 156. durationInFrames 175 (~160 final ease + settle).
 */
export const OnboardingStepperFlowExampleScene = () => <OnboardingStepperFlow />;

export const onboardingStepperFlowExampleCode = (): string => {
  return `import { OnboardingStepperFlow } from "@/components/remocn/onboarding-stepper-flow";

export const Scene = () => <OnboardingStepperFlow />;`;
};
