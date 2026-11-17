import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const widthLockConfig: ComponentConfig = {
  componentName: "WidthLock",
  importPath: "@/components/remocn/width-lock",
  lists: {
    words: {
      default: ["trailer", "transitions", "captions", "launch video"],
      description: "Words",
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
    before: {
      type: "text-content",
      default: "Ship the",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "by tonight.",
      description: "After",
    },
    hold: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 480,
      min: 100,
      max: 1000,
      step: 10,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Roboto Flex", grain: true }),
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
