import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const numberMosaicConfig: ComponentConfig = {
  componentName: "NumberMosaic",
  importPath: "@/components/remocn/number-mosaic",
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
    value: {
      type: "text-content",
      default: "10,000",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "launch videos rendered",
      description: "Label",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    sweep: {
      type: "number",
      default: 26,
      min: 0,
      max: 80,
      step: 1,
      description: "Light sweep (frames)",
      hiddenFromList: false,
    },
    cellSize: {
      type: "number",
      default: 12,
      min: 8,
      max: 24,
      step: 1,
      description: "Cell size",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Space Grotesk", grain: true }),
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
