import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const lightTrailWriteConfig: ComponentConfig = {
  componentName: "LightTrailWrite",
  importPath: "@/components/remocn/light-trail-write",
  controls: {
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    finish: {
      type: "enum",
      default: "solid",
      variants: {
        solid: {},
        accent: {},
      },
      description: "Finish",
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
