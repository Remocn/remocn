import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const dumbbellShiftConfig: ComponentConfig = {
  componentName: "DumbbellShift",
  importPath: "@/components/remocn/dumbbell-shift",
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
    beforeLabel: {
      type: "text-content",
      default: "Before",
      description: "Before label",
    },
    afterLabel: {
      type: "text-content",
      default: "With remocn",
      description: "After label",
    },
    stagger: {
      type: "number",
      default: 5,
      min: 0,
      max: 12,
      step: 1,
      description: "Row stagger",
      hiddenFromList: false,
    },
    slideDuration: {
      type: "number",
      default: 26,
      min: 8,
      max: 60,
      step: 1,
      description: "Slide (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Schibsted Grotesk", grain: true }),
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
