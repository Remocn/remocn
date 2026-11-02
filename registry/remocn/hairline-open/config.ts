import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const hairlineOpenConfig: ComponentConfig = {
  componentName: "HairlineOpen",
  importPath: "@/components/remocn/hairline-open",
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
    from: {
      type: "text-content",
      default: "Write the story",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "Ship the film",
      description: "To",
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
  durationInFrames: 105,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
