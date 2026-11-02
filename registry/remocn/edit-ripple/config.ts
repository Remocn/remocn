import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
