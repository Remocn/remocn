import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const priceSlateConfig: ComponentConfig = {
  componentName: "PriceSlate",
  importPath: "@/components/remocn/price-slate",
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
    price: {
      type: "text-content",
      default: "$0",
      description: "Price",
    },
    was: {
      type: "text-content",
      default: "$29",
      description: "Was",
    },
    lead: {
      type: "text-content",
      default: "From",
      description: "Lead",
    },
    note: {
      type: "text-content",
      default: "per seat · billed yearly",
      description: "Note",
    },
    availability: {
      type: "text-content",
      default: "Available today",
      description: "Availability",
    },
    product: {
      type: "text-content",
      default: "Pro",
      description: "Product",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
