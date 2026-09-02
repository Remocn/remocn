import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const introducingProductConfig: ComponentConfig = {
  componentName: "IntroducingProduct",
  importPath: "@/components/remocn/templates/introducing-product",
  controls: {
    productName: {
      type: "text-content",
      default: "Northstar",
      description: "Product name",
    },
    tagline: {
      type: "text-content",
      default: "Turn complexity into forward motion.",
      description: "Product tagline",
    },
    hookLine: {
      type: "text-content",
      default: "Become the builder",
      description: "Opening statement",
    },
    contrastLine: {
      type: "text-content",
      default: "AI cannot replace",
      description: "Contrast statement",
    },
    command: {
      type: "text-content",
      default: "/show me how the product really works",
      description: "Command prompt",
    },
    benefit: {
      type: "text-content",
      default: "Move beyond limits",
      description: "Benefit statement",
    },
    metric: {
      type: "text-content",
      default: "10× faster",
      description: "Value metric",
    },
    accentColor: {
      type: "color",
      default: "#6d3cff",
      description: "Accent color",
    },
    warmColor: {
      type: "color",
      default: "#ff7a33",
      description: "Warm accent color",
    },
  },
  durationInFrames: 1596,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
