import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const theTabConfig: ComponentConfig = {
  componentName: "TheTab",
  importPath: "@/components/remocn/the-tab",
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
    price: {
      type: "text-content",
      default: "$0",
      description: "Price",
    },
    totalLabel: {
      type: "text-content",
      default: "Total",
      description: "Total label",
    },
    total: {
      type: "text-content",
      default: "one Sunday morning.",
      description: "Total",
    },
    stagger: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Total word stagger",
      hiddenFromList: false,
    },
    leaders: { type: "boolean", default: true, description: "Dotted leaders" },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Albert Sans" }),
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
