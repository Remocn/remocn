import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const checkoutFlowConfig: ComponentConfig = {
  componentName: "CheckoutFlow",
  importPath: "@/components/remocn/checkout-flow",
  controls: {},
  durationInFrames: 320,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(0.97 0 0)" },
};
