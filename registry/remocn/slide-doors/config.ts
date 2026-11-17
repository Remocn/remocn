import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const slideDoorsConfig: ComponentConfig = {
  componentName: "SlideDoors",
  importPath: "@/components/remocn/slide-doors",
  lists: {
    lines: {
      default: ["Scenes that move.", "Code you own.", "Arriving in your repo."],
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
    highlight: {
      type: "text-content",
      default: "repo.",
      description: "Highlight",
    },
    hold: {
      type: "number",
      default: 28,
      min: 0,
      max: 84,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 400,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Plus Jakarta Sans" }),
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
