import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tileWaveConfig: ComponentConfig = {
  componentName: "TileWave",
  importPath: "@/components/remocn/tile-wave",
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
      default: "Idea.",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "Shipped.",
      description: "To",
    },
    rows: {
      type: "number",
      default: 8,
      min: 0,
      max: 24,
      step: 1,
      description: "Rows",
      hiddenFromList: false,
    },
    delay: {
      type: "number",
      default: 16,
      min: 0,
      max: 48,
      step: 1,
      description: "Delay",
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
  durationInFrames: 94,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
