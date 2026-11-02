import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tallyMarksConfig: ComponentConfig = {
  componentName: "TallyMarks",
  importPath: "@/components/remocn/tally-marks",
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
    label: {
      type: "text-content",
      default: "videos rendered on launch day",
      description: "Label",
    },
    value: {
      type: "number",
      default: 1240,
      min: 0,
      max: 3720,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    rows: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Rows",
      hiddenFromList: false,
    },
    groupsPerRow: {
      type: "number",
      default: 9,
      min: 0,
      max: 27,
      step: 1,
      description: "Groups per row",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
