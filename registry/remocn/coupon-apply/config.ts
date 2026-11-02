import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const couponApplyConfig: ComponentConfig = {
  componentName: "CouponApply",
  importPath: "@/components/remocn/coupon-apply",
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
    merchant: {
      type: "text-content",
      default: "Lumen",
      description: "Merchant",
    },
    invalidCode: {
      type: "text-content",
      default: "LAUNCH",
      description: "Invalid code",
    },
    code: {
      type: "text-content",
      default: "LAUNCH24",
      description: "Code",
    },
    currency: {
      type: "text-content",
      default: "$",
      description: "Currency",
    },
    payLabel: {
      type: "text-content",
      default: "Subscribe",
      description: "Pay label",
    },
    email: {
      type: "text-content",
      default: "maya@kitebase.com",
      description: "Email",
    },
    cardholder: {
      type: "text-content",
      default: "Maya Chen",
      description: "Cardholder",
    },
    percentOff: {
      type: "number",
      default: 10,
      min: 0,
      max: 30,
      step: 1,
      description: "Percent off",
      hiddenFromList: false,
    },
  },
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
