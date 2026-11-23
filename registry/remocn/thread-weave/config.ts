import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const threadWeaveConfig: ComponentConfig = {
  componentName: "ThreadWeave",
  importPath: "@/components/remocn/thread-weave",
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
    value: {
      type: "text-content",
      default: "24",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "frames per second",
      description: "Caption",
    },
    motif: {
      type: "enum",
      default: "value",
      variants: {
        value: {},
        mark: {},
      },
      description: "Motif",
    },
    weave: {
      type: "number",
      default: 108,
      min: 40,
      max: 180,
      step: 4,
      description: "Weave length (frames)",
      hiddenFromList: false,
    },
    stats: {
      type: "boolean",
      default: true,
      description: "Ends × picks counter",
    },
    ...sceneControls({ font: "Space Grotesk", grain: true }),
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
