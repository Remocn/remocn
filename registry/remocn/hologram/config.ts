import { hologramExampleCode } from "@/components/docs/examples/hologram-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const hologramConfig: ComponentConfig = {
  componentName: "Hologram",
  importPath: "@/components/remocn/hologram",
  controls: {
    tint: {
      type: "color",
      default: "#63e8ff",
      description: "Tint",
    },
    glow: {
      type: "number",
      min: 0,
      max: 3,
      step: 0.1,
      default: 1,
      description: "Glow",
      hiddenFromList: false,
    },
    ghost: {
      type: "number",
      min: 0,
      max: 3,
      step: 0.1,
      default: 1,
      description: "Ghost",
      hiddenFromList: false,
    },
    flicker: {
      type: "number",
      min: 0,
      max: 3,
      step: 0.1,
      default: 1,
      description: "Flicker",
      hiddenFromList: false,
    },
    intensity: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 1,
      description: "Intensity",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#04070d" },
  snippet: hologramExampleCode,
};
