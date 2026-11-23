import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const glassCapsuleConfig: ComponentConfig = {
  componentName: "GlassCapsule",
  importPath: "@/components/remocn/glass-capsule",
  lists: {
    lines: {
      default: ["Launch films", "that move."],
      description: "Lines",
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
    focus: {
      type: "text-content",
      default: "move",
      description: "Focus",
    },
    magnify: {
      type: "number",
      default: 1.1,
      min: 1,
      max: 1.5,
      step: 0.01,
      description: "Magnify",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Sans", grain: true }),
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
