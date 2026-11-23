import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const shareDonutConfig: ComponentConfig = {
  componentName: "ShareDonut",
  importPath: "@/components/remocn/share-donut",
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
    highlight: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Highlight",
      hiddenFromList: false,
    },
    drawLength: {
      type: "number",
      default: 52,
      min: 10,
      max: 120,
      step: 1,
      description: "Draw length (frames)",
      hiddenFromList: false,
    },
    thickness: {
      type: "number",
      default: 12,
      min: 2,
      max: 40,
      step: 1,
      description: "Ring thickness",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "DM Sans", grain: true }),
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
