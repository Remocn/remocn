import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pointIntroConfig: ComponentConfig = {
  componentName: "PointIntro",
  importPath: "@/components/remocn/point-intro",
  controls: {
    theme: {
      type: "enum",
      default: "light",
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
    title: {
      type: "text-content",
      default: "Introducing remocn 2.0",
      description: "Title",
    },
    subline: {
      type: "text-content",
      default: "Animated components for Remotion. Free and open source.",
      description: "Subline",
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
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
