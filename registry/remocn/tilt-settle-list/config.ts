import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tiltSettleListConfig: ComponentConfig = {
  componentName: "TiltSettleList",
  importPath: "@/components/remocn/tilt-settle-list",
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
    title: {
      type: "text-content",
      default: "Your top scenes",
      description: "Title",
    },
    heroTitle: {
      type: "text-content",
      default: "Zoom Blur",
      description: "Hero title",
    },
    heroMeta: {
      type: "text-content",
      default: "Transition · 2.4k renders",
      description: "Hero meta",
    },
    accentWord: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent word",
      hiddenFromList: false,
    },
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
