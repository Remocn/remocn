import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const stripeCountConfig: ComponentConfig = {
  componentName: "StripeCount",
  importPath: "@/components/remocn/stripe-count",
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
    prefix: {
      type: "text-content",
      default: "",
      description: "Prefix",
    },
    suffix: {
      type: "text-content",
      default: "",
      description: "Suffix",
    },
    label: {
      type: "text-content",
      default: "scenes that take your brand colour from one prop",
      description: "Label",
    },
    value: {
      type: "number",
      default: 184,
      min: 0,
      max: 552,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    from: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    stripes: {
      type: "number",
      default: 12,
      min: 0,
      max: 36,
      step: 1,
      description: "Stripes",
      hiddenFromList: false,
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
