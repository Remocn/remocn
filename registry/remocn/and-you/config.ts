import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const andYouConfig: ComponentConfig = {
  componentName: "AndYou",
  importPath: "@/components/remocn/and-you",
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
    last: {
      type: "text-content",
      default: "and you.",
      description: "Last",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
