import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const contributionHeatmapConfig: ComponentConfig = {
  componentName: "ContributionHeatmap",
  importPath: "@/components/remocn/contribution-heatmap",
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
    label: {
      type: "text-content",
      default: "renders this year",
      description: "Label",
    },
    value: {
      type: "number",
      default: 12480,
      min: 0,
      max: 37440,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    weeks: {
      type: "number",
      default: 52,
      min: 0,
      max: 156,
      step: 1,
      description: "Weeks",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
