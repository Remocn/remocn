import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const aiImageGridConfig: ComponentConfig = {
  componentName: "AiImageGrid",
  importPath: "@/components/remocn/ai-image-grid",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    prompt: {
      type: "text-content",
      default: "isometric glass city at sunrise, soft light",
      description: "Prompt",
    },
    model: {
      type: "text-content",
      default: "remocn Image 2",
      description: "Model",
    },
    placeholder: {
      type: "text-content",
      default: "Describe an image",
      description: "Prompt placeholder",
    },
    downloadLabel: {
      type: "text-content",
      default: "Download",
      description: "Download label",
    },
    layout: {
      type: "enum",
      default: "2x2",
      variants: {
        "2x2": {},
        "3x2": {},
      },
      description: "Layout",
    },
    pick: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Pick",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Tile stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
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
  durationInFrames: 240,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
