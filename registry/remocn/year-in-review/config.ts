import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const yearInReviewConfig: ComponentConfig = {
  componentName: "YearInReview",
  importPath: "@/components/remocn/year-in-review",
  controls: {
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    device: {
      type: "enum",
      default: "phone",
      variants: {
        phone: {},
        card: {},
      },
      description: "Device",
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
  durationInFrames: 480,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
