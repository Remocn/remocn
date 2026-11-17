import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const photoFillTypeConfig: ComponentConfig = {
  componentName: "PhotoFillType",
  importPath: "@/components/remocn/photo-fill-type",
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
      default: "Dusk",
      description: "Title",
    },
    caption: {
      type: "text-content",
      default: "Not a photograph. Every pixel is code.",
      description: "Caption",
    },
    expandAt: {
      type: "number",
      default: 72,
      min: 30,
      max: 110,
      step: 1,
      description: "Expand at (frame)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Barlow Condensed", grain: true }),
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
