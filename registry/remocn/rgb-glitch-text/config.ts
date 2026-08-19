import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rgbGlitchTextConfig: ComponentConfig = {
  componentName: "RGBGlitchText",
  importPath: "@/components/remocn/rgb-glitch-text",
  controls: {
    text: {
      type: "text-content",
      default: "GLITCH",
      description: "Text",
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 200,
      step: 1,
      default: 96,
      description: "Font size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "700",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
    glitchAt: {
      type: "number",
      min: 0,
      max: 120,
      step: 1,
      default: 20,
      description: "Glitch at (frame)",
      hiddenFromList: false,
    },
    glitchDuration: {
      type: "number",
      min: 1,
      max: 60,
      step: 1,
      default: 8,
      description: "Glitch duration",
      hiddenFromList: false,
    },
    intensity: {
      type: "number",
      min: 0,
      max: 30,
      step: 1,
      default: 6,
      description: "Intensity (px)",
      hiddenFromList: false,
    },
    seed: {
      type: "text-content",
      default: "glitch",
      description: "Seed",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
