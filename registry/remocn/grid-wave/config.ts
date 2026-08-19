import { gridWaveExampleCode } from "@/components/docs/examples/grid-wave-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const gridWaveConfig: ComponentConfig = {
  componentName: "gridWave",
  importPath: "@/components/remocn/grid-wave",
  controls: {
    tileSize: {
      type: "number",
      min: 30,
      max: 260,
      step: 10,
      default: 90,
      description: "Tile size",
      hiddenFromList: false,
    },
    waveWidth: {
      type: "number",
      min: 0.04,
      max: 0.5,
      step: 0.02,
      default: 0.16,
      description: "Wave width",
      hiddenFromList: false,
    },
    lift: {
      type: "number",
      min: 0,
      max: 4,
      step: 0.1,
      default: 2,
      description: "Lift",
      hiddenFromList: false,
    },
    gap: {
      type: "number",
      min: 0,
      max: 0.45,
      step: 0.01,
      default: 0.12,
      description: "Gap",
      hiddenFromList: false,
    },
    tint: {
      type: "color",
      default: "#8fb4ff",
      description: "Tint",
    },
    direction: {
      type: "enum",
      default: "ripple",
      variants: {
        ripple: {},
        left: {},
        right: {},
        up: {},
        down: {},
      },
      description: "Direction",
    },
  },
  durationInFrames: 84,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: gridWaveExampleCode,
};
