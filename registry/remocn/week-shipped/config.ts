import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const weekShippedConfig: ComponentConfig = {
  componentName: "WeekShipped",
  importPath: "@/components/remocn/week-shipped",
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
      default: 13,
      min: 4,
      max: 40,
      step: 1,
      description: "Day beat (frames)",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 36,
      min: 0,
      max: 90,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
