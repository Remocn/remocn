import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const glassLensConfig: ComponentConfig = {
  componentName: "GlassLens",
  importPath: "@/components/remocn/glass-lens",
  lists: {
    lines: {
      default: ["Every frame,", "composed."],
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
    cta: {
      type: "text-content",
      default: "Start with remocn",
      description: "Cta",
    },
    previewTitle: {
      type: "text-content",
      default: "Launch day.",
      description: "Preview title",
    },
    italicLast: {
      type: "boolean",
      default: true,
      description: "Italic last",
    },
    magnify: {
      type: "number",
      default: 1,
      min: 0,
      max: 3,
      step: 0.1,
      description: "Magnify",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Newsreader", grain: true }),
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
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
