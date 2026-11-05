import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const spineTurnConfig: ComponentConfig = {
  componentName: "SpineTurn",
  importPath: "@/components/remocn/spine-turn",
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
    hold: {
      type: "number",
      default: 26,
      min: 0,
      max: 78,
      step: 1,
      description: "Hold",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
