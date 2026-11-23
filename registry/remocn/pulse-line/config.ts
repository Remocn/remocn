import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const pulseLineConfig: ComponentConfig = {
  componentName: "PulseLine",
  importPath: "@/components/remocn/pulse-line",
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
    text: {
      type: "text-content",
      default: "Every frame has a pulse.",
      description: "Text",
    },
    highlight: {
      type: "text-content",
      default: "a pulse.",
      description: "Highlight",
    },
    caption: {
      type: "text-content",
      default: "Motion components for Remotion. Copy one in, own every frame.",
      description: "Caption",
    },
    beats: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Beats",
      hiddenFromList: false,
    },
    amplitude: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.05,
      description: "Pulse height",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 800,
      step: 100,
      description: "Weight",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
