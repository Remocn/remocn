import { parallaxDepthExampleCode } from "@/components/docs/examples/parallax-depth-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const parallaxDepthConfig: ComponentConfig = {
  componentName: "ParallaxDepth",
  importPath: "@/components/remocn/parallax-depth",
  controls: {
    distance: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1.2,
      step: 0.05,
      description: "Truck distance",
      hiddenFromList: false,
    },
    push: {
      type: "number",
      default: 0.16,
      min: 0,
      max: 0.6,
      step: 0.02,
      description: "Push-in",
      hiddenFromList: false,
    },
    direction: {
      type: "enum",
      default: "right",
      variants: { right: {}, left: {} },
      description: "Direction",
    },
    seed: {
      type: "number",
      default: 3,
      min: 1,
      max: 24,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    skyColor: { type: "color", default: "#111111", description: "Sky" },
    sunColor: { type: "color", default: "#E5322D", description: "Sun" },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: parallaxDepthExampleCode,
};
