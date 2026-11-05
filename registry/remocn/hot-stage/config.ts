import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const hotStageConfig: ComponentConfig = {
  componentName: "HotStage",
  importPath: "@/components/remocn/hot-stage",
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
    stage: {
      type: "number",
      default: 44,
      min: 0,
      max: 132,
      step: 1,
      description: "Stage",
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
  durationInFrames: 155,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
