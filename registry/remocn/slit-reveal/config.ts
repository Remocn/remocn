import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const slitRevealConfig: ComponentConfig = {
  componentName: "SlitReveal",
  importPath: "@/components/remocn/slit-reveal",
  controls: {
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "Introducing remocn",
      description: "Title",
    },
    opening: {
      type: "enum",
      default: "letterbox",
      variants: {
        letterbox: {},
        sideways: {},
      },
      description: "Opening",
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
