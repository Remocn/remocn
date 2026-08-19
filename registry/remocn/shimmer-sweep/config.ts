import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shimmerSweepConfig: ComponentConfig = {
  componentName: "ShimmerSweep",
  importPath: "@/components/remocn/shimmer-sweep",
  controls: {
    text: {
      type: "text-content",
      default: "Generating",
      description: "Text",
    },
    baseColor: {
      type: "color",
      default: "#3f3f46",
      description: "Base color",
    },
    shineColor: {
      type: "color",
      default: "#fafafa",
      description: "Shine color",
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 200,
      step: 1,
      default: 96,
      description: "Font size",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "enum",
      default: "700",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
