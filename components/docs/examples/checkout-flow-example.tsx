"use client";

import { CheckoutFlow } from "@/registry/remocn-ui/checkout-flow";

/**
 * Fixed lifecycle demo for the `checkout-flow` block: the card and its fields
 * blur-in (card → header → toggle → card number → terms → Pay), then a cursor
 * flips the billing toggle monthly → yearly, types the card number, ticks the
 * terms checkbox, and presses Pay → loading → success, ending in a success
 * Toast. The block is a pure orchestrator — every channel comes from a composed
 * primitive's hook.
 *
 * Timeline: entrance 0→58; toggle click 64 ≡ toggle slide 64; card field click
 * 96 → typing 100→140; terms click 150 ≡ checkbox checked 150; Pay click 180 →
 * loading 186 → success 224; toast enter 224 → dismiss 286. durationInFrames
 * 320 (286 + 14 dismiss + ~20 settle).
 */
export const CheckoutFlowExampleScene = () => <CheckoutFlow />;

export const checkoutFlowExampleCode = (): string => {
  return `import { CheckoutFlow } from "@/components/remocn/checkout-flow";

export const Scene = () => <CheckoutFlow />;`;
};
