import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const transitLinesConfig: ComponentConfig = {
  componentName: "TransitLines",
  importPath: "@/components/remocn/transit-lines",
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
    title: {
      type: "text-content",
      default: "remocn",
      description: "Title",
    },
    kicker: {
      type: "text-content",
      default: "Next stop",
      description: "Kicker",
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
