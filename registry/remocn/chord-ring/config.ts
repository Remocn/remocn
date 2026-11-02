import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const chordRingConfig: ComponentConfig = {
  componentName: "ChordRing",
  importPath: "@/components/remocn/chord-ring",
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
    caption: {
      type: "text-content",
      default: "Connects to everything",
      description: "Caption",
    },
    brandIndex: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Brand index",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
