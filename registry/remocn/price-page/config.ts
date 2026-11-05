import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pricePageConfig: ComponentConfig = {
  componentName: "PricePage",
  importPath: "@/components/remocn/price-page",
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
    label: {
      type: "text-content",
      default: "Pricing",
      description: "Label",
    },
    price: {
      type: "text-content",
      default: "Free.",
      description: "Price",
    },
    note: {
      type: "text-content",
      default: "That’s the whole pricing page.",
      description: "Note",
    },
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
