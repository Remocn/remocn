import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const rewriteBarsConfig: ComponentConfig = {
  componentName: "RewriteBars",
  importPath: "@/components/remocn/rewrite-bars",
  lists: {
    headlines: {
      default: [
        "Scenes you copy, not configure.",
        "Captions that move with the voice.",
        "Your launch video, rendered from code.",
      ],
      description: "Headlines",
    },
    eyebrows: {
      default: ["01 · Scenes", "02 · Captions", "03 · Render"],
      description: "Eyebrows",
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
      default: "rendered from code",
      description: "Highlight",
    },
    align: {
      type: "enum",
      default: "center",
      variants: {
        center: {},
        left: {},
      },
      description: "Align",
    },
    hold: {
      type: "number",
      default: 20,
      min: 0,
      max: 60,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Figtree" }),
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
  durationInFrames: 190,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
