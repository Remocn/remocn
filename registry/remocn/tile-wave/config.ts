import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    spread: {
      type: "number",
      default: 26,
      min: 2,
      max: 80,
      step: 1,
      description: "Wave spread (frames)",
      hiddenFromList: false,
    },
    swap: {
      type: "number",
      default: 22,
      min: 4,
      max: 60,
      step: 1,
      description: "Tile swap (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Space Grotesk", grain: true }),
    // After sceneControls so its 0-default delay doesn't replace this one.
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
