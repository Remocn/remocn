import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const homeWidgetConfig: ComponentConfig = {
  componentName: "HomeWidget",
  importPath: "@/components/remocn/home-widget",
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
    appName: {
      type: "text-content",
      default: "remocn",
      description: "App name",
    },
    widgetName: {
      type: "text-content",
      default: "Renders",
      description: "Widget name",
    },
    widgetDescription: {
      type: "text-content",
      default: "Track renders and views at a glance.",
      description: "Widget description",
    },
    size: {
      type: "enum",
      default: "medium",
      variants: {
        small: {},
        medium: {},
      },
      description: "Size",
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
  durationInFrames: 290,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
