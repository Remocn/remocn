import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const coolDownConfig: ComponentConfig = {
  componentName: "CoolDown",
  importPath: "@/components/remocn/cool-down",
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
    title: {
      type: "text-content",
      default: "Runs cool.",
      description: "Title",
    },
    label: {
      type: "text-content",
      default: "a full launch film rendered, fans silent",
      description: "Label",
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
