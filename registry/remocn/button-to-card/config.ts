import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const buttonToCardConfig: ComponentConfig = {
  componentName: "ButtonToCard",
  importPath: "@/components/remocn/button-to-card",
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
    buttonLabel: {
      type: "text-content",
      default: "Add an item",
      description: "Button label",
    },
    name: {
      type: "text-content",
      default: "Ceramic pitcher",
      description: "Name",
    },
    price: {
      type: "text-content",
      default: "$48.00",
      description: "Price",
    },
    storeName: {
      type: "text-content",
      default: "Studio Goods",
      description: "Store name",
    },
    formTitle: {
      type: "text-content",
      default: "New product",
      description: "Form title",
    },
    saveLabel: {
      type: "text-content",
      default: "Add to store",
      description: "Save label",
    },
    dropLabel: {
      type: "text-content",
      default: "Drop an image here",
      description: "Drop label",
    },
    accent: {
      type: "color",
      default: "#f2552c",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Hanken Grotesk" }),
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
  durationInFrames: 162,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
