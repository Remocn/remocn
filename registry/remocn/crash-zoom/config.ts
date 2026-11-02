import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const crashZoomConfig: ComponentConfig = {
  componentName: "CrashZoom",
  importPath: "@/components/remocn/crash-zoom",
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
    tease: {
      type: "text-content",
      default: "Wait for it…",
      description: "Tease",
    },
    reveal: {
      type: "text-content",
      default: "1 DAY.",
      description: "Reveal",
    },
    tagline: {
      type: "text-content",
      default: "to make this video.",
      description: "Tagline",
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
