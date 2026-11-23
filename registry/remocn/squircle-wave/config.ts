import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const squircleWaveConfig: ComponentConfig = {
  componentName: "SquircleWave",
  importPath: "@/components/remocn/squircle-wave",
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
    sweep: {
      type: "number",
      default: 70,
      min: 20,
      max: 140,
      step: 2,
      description: "Sweep (frames)",
      hiddenFromList: false,
    },
    angle: {
      type: "number",
      default: 16,
      min: -45,
      max: 45,
      step: 1,
      description: "Wave angle",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ ink: false, grain: true }),
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
