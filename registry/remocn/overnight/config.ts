import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const overnightConfig: ComponentConfig = {
  componentName: "Overnight",
  importPath: "@/components/remocn/overnight",
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
    nightAt: {
      type: "number",
      default: 52,
      min: 0,
      max: 120,
      step: 1,
      description: "Night at (frame)",
      hiddenFromList: false,
    },
    morningAt: {
      type: "number",
      default: 118,
      min: 40,
      max: 160,
      step: 1,
      description: "Morning at (frame)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Afacad", ink: false }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
