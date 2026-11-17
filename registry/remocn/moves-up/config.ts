import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const movesUpConfig: ComponentConfig = {
  componentName: "MovesUp",
  importPath: "@/components/remocn/moves-up",
  lists: {
    items: {
      default: [
        "Auto captions",
        "Voiceover",
        "Vertical cuts",
        "Your type, your colours",
        "Whatever you ask for",
      ],
      description: "Items",
    },
    labels: {
      default: ["Now", "Next", "Later"],
      description: "Labels",
      min: 3,
      max: 3,
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
    shipped: {
      type: "text-content",
      default: "shipped",
      description: "Shipped",
    },
    hold: {
      type: "number",
      default: 22,
      min: 0,
      max: 90,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    interval: {
      type: "number",
      default: 66,
      min: 20,
      max: 140,
      step: 2,
      description: "Ship interval (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Golos Text" }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
