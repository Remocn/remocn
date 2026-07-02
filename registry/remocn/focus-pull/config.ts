import { focusPullExampleCode } from "@/components/docs/examples/focus-pull-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const focusPullConfig: ComponentConfig = {
  componentName: "focusPull",
  importPath: "@/components/remocn/focus-pull",
  controls: {
    blur: {
      type: "number",
      default: 16,
      min: 4,
      max: 32,
      step: 1,
      label: "Blur",
    },
  },
  durationInFrames: 114,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: focusPullExampleCode,
};
