import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const splitFlashConfig: ComponentConfig = {
  componentName: "SplitFlash",
  importPath: "@/components/remocn/split-flash",
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
    time: {
      type: "text-content",
      default: "1:12.408",
      description: "Time",
    },
    delta: {
      type: "text-content",
      default: "−0.412",
      description: "Delta",
    },
    label: {
      type: "text-content",
      default: "Lap time",
      description: "Label",
    },
    flashLabel: {
      type: "text-content",
      default: "Fastest lap",
      description: "Flash label",
    },
    freezeAt: {
      type: "number",
      default: 42,
      min: 10,
      max: 90,
      step: 1,
      description: "Freeze frame",
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
  durationInFrames: 96,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
