import { hyperspaceExampleCode } from "@/components/docs/examples/hyperspace-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const hyperspaceConfig: ComponentConfig = {
  componentName: "hyperspace",
  importPath: "@/components/remocn/hyperspace",
  controls: {
    stars: {
      type: "number",
      min: 40,
      max: 600,
      step: 20,
      default: 260,
      description: "Stars",
      hiddenFromList: false,
    },
    streakColor: {
      type: "color",
      default: "#FFFFFF",
      description: "Streak color",
    },
    accentColor: {
      type: "color",
      default: "#E5322D",
      description: "Accent color",
    },
    accentRatio: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.02,
      default: 0.14,
      description: "Accent ratio",
      hiddenFromList: false,
    },
    flash: { type: "boolean", default: true, description: "Flash" },
    flashColor: {
      type: "color",
      default: "#FFFFFF",
      description: "Flash color",
    },
  },
  durationInFrames: 124,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: hyperspaceExampleCode,
};
