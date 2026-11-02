import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pricingRevealConfig: ComponentConfig = {
  componentName: "PricingReveal",
  importPath: "@/components/remocn/pricing-reveal",
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
    currency: {
      type: "text-content",
      default: "$",
      description: "Currency",
    },
    discountLabel: {
      type: "text-content",
      default: "−35% launch week",
      description: "Discount label",
    },
    badgeLabel: {
      type: "text-content",
      default: "Most picked",
      description: "Badge label",
    },
    eyebrow: {
      type: "text-content",
      default: "Billed monthly · cancel anytime",
      description: "Eyebrow",
    },
    heading: {
      type: "text-content",
      default: "Simple pricing for every launch.",
      description: "Heading",
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
  durationInFrames: 105,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
