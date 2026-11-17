import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const italicSpeedConfig: ComponentConfig = {
  componentName: "ItalicSpeed",
  importPath: "@/components/remocn/italic-speed",
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
      default: "FASTER",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Ship at race pace.",
      description: "Subtitle",
    },
    stagger: {
      type: "number",
      default: 1.2,
      min: 0,
      max: 4,
      step: 0.1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    lean: {
      type: "number",
      default: 34,
      min: 0,
      max: 60,
      step: 1,
      description: "Arrival lean",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Archivo" }),
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
  durationInFrames: 84,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
