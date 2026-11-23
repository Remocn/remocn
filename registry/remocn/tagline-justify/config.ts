import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const taglineJustifyConfig: ComponentConfig = {
  componentName: "TaglineJustify",
  importPath: "@/components/remocn/tagline-justify",
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
      default: "Your launch deserves a film as good as the product.",
      description: "Text",
    },
    highlight: {
      type: "text-content",
      default: "film",
      description: "Highlight",
    },
    stagger: {
      type: "number",
      default: 6,
      min: 1,
      max: 16,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
