import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const lightTrailWriteConfig: ComponentConfig = {
  componentName: "LightTrailWrite",
  importPath: "@/components/remocn/light-trail-write",
  controls: {
    finish: {
      type: "enum",
      default: "solid",
      variants: {
        solid: {},
        accent: {},
      },
      description: "Finish",
    },
    write: {
      type: "number",
      default: 80,
      min: 30,
      max: 150,
      step: 5,
      description: "Write (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    background: {
      type: "color",
      default: "#050508",
      description: "Background",
    },
    ...sceneControls({ ink: false, background: false, grain: true }),
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
