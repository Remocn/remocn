import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const chunkStackConfig: ComponentConfig = {
  componentName: "ChunkStack",
  importPath: "@/components/remocn/chunk-stack",
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
    text: {
      type: "text-content",
      default: "learn motion by making it",
      description: "Text",
    },
    highlight: {
      type: "text-content",
      default: "making",
      description: "Highlight",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 900,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Drop stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Nunito" }),
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
