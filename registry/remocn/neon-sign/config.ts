import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const neonSignConfig: ComponentConfig = {
  componentName: "NeonSign",
  importPath: "@/components/remocn/neon-sign",
  controls: {
    strokeWidth: {
      type: "number",
      default: 6,
      min: 2,
      max: 14,
      step: 1,
      description: "Tube width",
      hiddenFromList: false,
    },
    fit: {
      type: "number",
      default: 0.62,
      min: 0.3,
      max: 0.9,
      step: 0.01,
      description: "Fit",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 7,
      min: 1,
      max: 99,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    color: { type: "color", default: "#E5322D", description: "Tube" },
    glowColor: { type: "color", default: "#E5322D", description: "Glow" },
    tubeColor: { type: "color", default: "#2A2A2A", description: "Unlit tube" },
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
};
