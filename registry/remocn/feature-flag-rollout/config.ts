import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    doneLabel: {
      type: "text-content",
      default: "Fully rolled out",
      description: "Done label",
    },
    passingLabel: {
      type: "text-content",
      default: "All passing",
      description: "Passing label",
    },
    stepGap: {
      type: "number",
      default: 48,
      min: 24,
      max: 72,
      step: 4,
      description: "Step gap (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Figtree" }),
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
