import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pinnedWordConfig: ComponentConfig = {
  componentName: "PinnedWord",
  importPath: "@/components/remocn/pinned-word",
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
    word: {
      type: "text-content",
      default: "video",
      description: "Word",
    },
    hold: {
      type: "number",
      default: 36,
      min: 0,
      max: 108,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
