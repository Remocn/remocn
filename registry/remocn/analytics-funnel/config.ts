import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const analyticsFunnelConfig: ComponentConfig = {
  componentName: "AnalyticsFunnel",
  importPath: "@/components/remocn/analytics-funnel",
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
    title: {
      type: "text-content",
      default: "Activation funnel",
      description: "Title",
    },
    variantLabel: {
      type: "text-content",
      default: "New onboarding",
      description: "Variant label",
    },
    dateRange: {
      type: "text-content",
      default: "Last 30 days",
      description: "Date range",
    },
    tooltipStep: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Tooltip step",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
