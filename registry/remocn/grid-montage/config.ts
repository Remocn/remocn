import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const gridMontageConfig: ComponentConfig = {
  componentName: "GridMontage",
  importPath: "@/components/remocn/grid-montage",
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
    beat: {
      type: "number",
      default: 14,
      min: 0,
      max: 42,
      step: 1,
      description: "Beat",
      hiddenFromList: false,
    },
    radius: {
      type: "number",
      default: 14,
      min: 0,
      max: 40,
      step: 1,
      description: "Corner radius",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Instrument Sans", ink: false, grain: true }),
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
