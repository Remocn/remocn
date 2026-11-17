import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const editRippleConfig: ComponentConfig = {
  componentName: "EditRipple",
  importPath: "@/components/remocn/edit-ripple",
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
    fontWeight: {
      type: "number",
      default: 500,
      min: 100,
      max: 900,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    lag: {
      type: "number",
      default: 14,
      min: 0,
      max: 40,
      step: 1,
      description: "Effect lag (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Epilogue" }),
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
  durationInFrames: 230,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
