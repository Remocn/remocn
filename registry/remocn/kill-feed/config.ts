import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const killFeedConfig: ComponentConfig = {
  componentName: "KillFeed",
  importPath: "@/components/remocn/kill-feed",
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
    banner: {
      type: "text-content",
      default: "Penta ship",
      description: "Banner",
    },
    caption: {
      type: "text-content",
      default: "5 / 5 eliminated",
      description: "Caption",
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
