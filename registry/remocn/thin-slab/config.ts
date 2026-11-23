import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const thinSlabConfig: ComponentConfig = {
  componentName: "ThinSlab",
  importPath: "@/components/remocn/thin-slab",
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
    title: {
      type: "text-content",
      default: "Time to your first launch video",
      description: "Title",
    },
    radius: {
      type: "number",
      default: 14,
      min: 0,
      max: 40,
      step: 1,
      description: "Slab radius",
      hiddenFromList: false,
    },
    squeezeDuration: {
      type: "number",
      default: 36,
      min: 12,
      max: 72,
      step: 2,
      description: "Squeeze (frames)",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Inter Tight" }),
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
