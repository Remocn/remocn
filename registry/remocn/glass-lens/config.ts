import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const glassLensConfig: ComponentConfig = {
  componentName: "GlassLens",
  importPath: "@/components/remocn/glass-lens",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    cta: {
      type: "text-content",
      default: "Start with remocn",
      description: "Cta",
    },
    italicLast: {
      type: "boolean",
      default: true,
      description: "Italic last",
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
