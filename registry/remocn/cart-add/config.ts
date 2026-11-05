import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cartAddConfig: ComponentConfig = {
  componentName: "CartAdd",
  importPath: "@/components/remocn/cart-add",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    brand: {
      type: "text-content",
      default: "fernway",
      description: "Brand",
    },
    product: {
      type: "text-content",
      default: "Summit Bottle",
      description: "Product",
    },
    category: {
      type: "text-content",
      default: "Drinkware",
      description: "Category",
    },
    description: {
      type: "text-content",
      default:
        "Double-wall steel keeps drinks cold for 24 hours. Leak-proof cap, powder-coat finish that never sweats.",
      description: "Description",
    },
    reviews: {
      type: "text-content",
      default: "2,184",
      description: "Reviews",
    },
    currency: {
      type: "text-content",
      default: "$",
      description: "Currency",
    },
    rating: {
      type: "number",
      default: 4.8,
      min: 0,
      max: 14.4,
      step: 0.01,
      description: "Rating",
      hiddenFromList: false,
    },
    startColor: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Start color",
      hiddenFromList: false,
    },
  },
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
