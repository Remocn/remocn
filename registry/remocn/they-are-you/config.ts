import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const theyAreYouConfig: ComponentConfig = {
  componentName: "TheyAreYou",
  importPath: "@/components/remocn/they-are-you",
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
    from: {
      type: "text-content",
      default: "They",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "You",
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
