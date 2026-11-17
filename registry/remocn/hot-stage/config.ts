import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const hotStageConfig: ComponentConfig = {
  componentName: "HotStage",
  importPath: "@/components/remocn/hot-stage",
  lists: {
    lines: {
      default: [
        "Storyboard the launch.",
        "Render on your laptop.",
        "Clear the tower.",
      ],
      description: "Lines",
    },
    log: {
      default: ["T+00:00  Liftoff", "T+02:41  Hot staging", "T+08:32  Orbit"],
      description: "Log",
    },
  },
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
    hold: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Space Grotesk" }),
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
