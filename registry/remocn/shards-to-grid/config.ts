import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shardsToGridConfig: ComponentConfig = {
  componentName: "ShardsToGrid",
  importPath: "@/components/remocn/shards-to-grid",
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
    title: {
      type: "text-content",
      default: "Launch v1",
      description: "Title",
    },
    status: {
      type: "text-content",
      default: "Assembling",
      description: "Status",
    },
    headline: {
      type: "text-content",
      default: "Every frame, written in code.",
      description: "Headline",
    },
  },
  durationInFrames: 144,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
