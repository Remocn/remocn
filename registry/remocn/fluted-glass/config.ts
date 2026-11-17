import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const flutedGlassConfig: ComponentConfig = {
  componentName: "FlutedGlass",
  importPath: "@/components/remocn/fluted-glass",
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
      default: "In focus.",
      description: "Title",
    },
    fluteWidth: {
      type: "number",
      default: 26,
      min: 10,
      max: 80,
      step: 1,
      description: "Flute width",
      hiddenFromList: false,
    },
    sweep: {
      type: "number",
      default: 46,
      min: 16,
      max: 120,
      step: 2,
      description: "Sweep (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Fraunces", grain: true }),
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
  durationInFrames: 145,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
