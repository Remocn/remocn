import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const heatTraceConfig: ComponentConfig = {
  componentName: "HeatTrace",
  importPath: "@/components/remocn/heat-trace",
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
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    tagline: {
      type: "text-content",
      default: "Launch-video scenes for Remotion. Copy, paste, render.",
      description: "Tagline",
    },
    eyebrow: {
      type: "text-content",
      default: "",
      description: "Eyebrow",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
