import { anamorphicFlareExampleCode } from "@/components/docs/examples/anamorphic-flare-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const anamorphicFlareConfig: ComponentConfig = {
  componentName: "AnamorphicFlare",
  importPath: "@/components/remocn/anamorphic-flare",
  controls: {
    ghosts: {
      type: "number",
      default: 4,
      min: 0,
      max: 8,
      step: 1,
      description: "Ghosts",
      hiddenFromList: false,
    },
    y: {
      type: "number",
      default: 0.5,
      min: 0.1,
      max: 0.9,
      step: 0.01,
      description: "Streak height",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 2,
      min: 1,
      max: 99,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    tint: { type: "color", default: "#E5322D", description: "Tint" },
    coreColor: { type: "color", default: "#FFFFFF", description: "Core" },
    backgroundColor: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
  },
  durationInFrames: 70,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: anamorphicFlareExampleCode,
};
