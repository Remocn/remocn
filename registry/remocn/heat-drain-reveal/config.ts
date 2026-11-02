import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const heatDrainRevealConfig: ComponentConfig = {
  componentName: "HeatDrainReveal",
  importPath: "@/components/remocn/heat-drain-reveal",
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
      default: "#ff7a2e",
      description: "Accent",
    },
    headline: {
      type: "text-content",
      default: "Plan the whole launch week.",
      description: "Headline",
    },
    monthLabel: {
      type: "text-content",
      default: "2026 / 11",
      description: "Month label",
    },
    firstDay: {
      type: "number",
      default: 26,
      min: 0,
      max: 78,
      step: 1,
      description: "First day",
      hiddenFromList: false,
    },
    daysInPrevMonth: {
      type: "number",
      default: 31,
      min: 0,
      max: 93,
      step: 1,
      description: "Days in prev month",
      hiddenFromList: false,
    },
    daysInMonth: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "Days in month",
      hiddenFromList: false,
    },
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
