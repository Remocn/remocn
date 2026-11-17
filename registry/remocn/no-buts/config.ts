import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const noButsConfig: ComponentConfig = {
  componentName: "NoButs",
  importPath: "@/components/remocn/no-buts",
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
    stagger: {
      type: "number",
      default: 2.5,
      min: 0,
      max: 8,
      step: 0.5,
      description: "Reply word stagger",
      hiddenFromList: false,
    },
    pause: {
      type: "number",
      default: 26,
      min: 0,
      max: 60,
      step: 1,
      description: "Pause (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Hubot Sans" }),
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
  durationInFrames: 255,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
