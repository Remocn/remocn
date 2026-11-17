import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const pointExpandConfig: ComponentConfig = {
  componentName: "PointExpand",
  importPath: "@/components/remocn/point-expand",
  lists: {
    statements: {
      default: [
        "Launch films used to take weeks.",
        "Now they take an afternoon.",
        "Copy, paste, render.",
      ],
      description: "Statements",
    },
  },
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    pulses: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Pulses",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 6,
      min: 0,
      max: 40,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Inter Tight", grain: true }),
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
