import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const featureFlagRolloutConfig: ComponentConfig = {
  componentName: "FeatureFlagRollout",
  importPath: "@/components/remocn/feature-flag-rollout",
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
    flagName: {
      type: "text-content",
      default: "New checkout flow",
      description: "Flag name",
    },
    flagKey: {
      type: "text-content",
      default: "new-checkout-flow",
      description: "Flag key",
    },
    environment: {
      type: "text-content",
      default: "Production",
      description: "Environment",
    },
    actor: {
      type: "text-content",
      default: "Maya Chen",
      description: "Actor",
    },
    totalUsers: {
      type: "number",
      default: 42800,
      min: 0,
      max: 128400,
      step: 1,
      description: "Total users",
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
  durationInFrames: 186,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
