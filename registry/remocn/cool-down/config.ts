import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    cooldown: {
      type: "number",
      default: 70,
      min: 10,
      max: 120,
      step: 1,
      description: "Cool down (frames)",
      hiddenFromList: false,
    },
    haze: {
      type: "number",
      default: 1,
      min: 0,
      max: 3,
      step: 0.1,
      description: "Heat shimmer",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Saira" }),
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
