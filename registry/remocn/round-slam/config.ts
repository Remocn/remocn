import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const roundSlamConfig: ComponentConfig = {
  componentName: "RoundSlam",
  importPath: "@/components/remocn/round-slam",
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
    round: {
      type: "text-content",
      default: "ROUND 1",
      description: "Round",
    },
    call: {
      type: "text-content",
      default: "SHIP!",
      description: "Call",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    shake: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.1,
      description: "Shake",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Unbounded" }),
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
  durationInFrames: 110,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
