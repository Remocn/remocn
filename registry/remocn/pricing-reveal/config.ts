import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 15,
      step: 1,
      description: "Card stagger",
      hiddenFromList: false,
    },
    radius: {
      type: "number",
      default: 18,
      min: 0,
      max: 40,
      step: 1,
      description: "Corner radius",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
