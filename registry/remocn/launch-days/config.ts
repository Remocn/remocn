import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const launchDaysConfig: ComponentConfig = {
  componentName: "LaunchDays",
  importPath: "@/components/remocn/launch-days",
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
    week: {
      type: "text-content",
      default: "Launch Week 01",
      description: "Week",
    },
    label: {
      type: "text-content",
      default: "New today",
      description: "Label",
    },
    revealUpcoming: {
      type: "boolean",
      default: false,
      description: "Reveal upcoming",
    },
    active: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Active",
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
  durationInFrames: 105,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
