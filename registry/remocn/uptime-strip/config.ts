import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const uptimeStripConfig: ComponentConfig = {
  componentName: "UptimeStrip",
  importPath: "@/components/remocn/uptime-strip",
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
    value: {
      type: "text-content",
      default: "99.99%",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "uptime",
      description: "Label",
    },
    days: {
      type: "number",
      default: 90,
      min: 0,
      max: 270,
      step: 1,
      description: "Days",
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
