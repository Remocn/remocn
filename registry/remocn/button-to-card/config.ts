import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
    accent: {
      type: "color",
      default: "#f2552c",
      description: "Accent",
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
  },
  durationInFrames: 162,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
