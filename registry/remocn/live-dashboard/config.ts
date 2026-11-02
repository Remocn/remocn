import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const liveDashboardConfig: ComponentConfig = {
  componentName: "LiveDashboard",
  importPath: "@/components/remocn/live-dashboard",
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
      default: "Today",
      description: "Title",
    },
    workspace: {
      type: "text-content",
      default: "Kitebase",
      description: "Workspace",
    },
    currency: {
      type: "text-content",
      default: "USD",
      description: "Currency",
    },
    change: {
      type: "number",
      default: 15.1,
      min: 0,
      max: 45.3,
      step: 0.01,
      description: "Change",
      hiddenFromList: false,
    },
    visitors: {
      type: "number",
      default: 128,
      min: 0,
      max: 384,
      step: 1,
      description: "Visitors",
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
  durationInFrames: 190,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
