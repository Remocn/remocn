import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const statInlineConfig: ComponentConfig = {
  componentName: "StatInline",
  importPath: "@/components/remocn/stat-inline",
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
    value: {
      type: "text-content",
      default: "12,480",
      description: "Value",
    },
    text: {
      type: "text-content",
      default: "Builders shipped {value} launch videos with remocn this year.",
      description: "Text",
    },
    label: {
      type: "text-content",
      default: "Launch videos shipped",
      description: "Label",
    },
    align: {
      type: "enum",
      default: "left",
      variants: {
        left: {},
        center: {},
      },
      description: "Align",
    },
    hold: {
      type: "number",
      default: 52,
      min: 10,
      max: 100,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    moveDuration: {
      type: "number",
      default: 28,
      min: 6,
      max: 60,
      step: 1,
      description: "Move (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
