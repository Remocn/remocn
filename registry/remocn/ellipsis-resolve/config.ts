import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const ellipsisResolveConfig: ComponentConfig = {
  componentName: "EllipsisResolve",
  importPath: "@/components/remocn/ellipsis-resolve",
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
    word: {
      type: "text-content",
      default: "Shipped",
      description: "Word",
    },
    resolveAt: {
      type: "number",
      default: 40,
      min: 10,
      max: 90,
      step: 1,
      description: "Resolve at (frame)",
      hiddenFromList: false,
    },
    sweepFrames: {
      type: "number",
      default: 26,
      min: 8,
      max: 60,
      step: 1,
      description: "Sweep (frames)",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Instrument Serif", grain: true }),
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
  durationInFrames: 131,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
