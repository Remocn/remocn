import { underwaterRippleExampleCode } from "@/components/docs/examples/underwater-ripple-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const underwaterRippleConfig: ComponentConfig = {
  componentName: "UnderwaterRipple",
  importPath: "@/components/remocn/underwater-ripple",
  controls: {
    amplitude: {
      type: "number",
      min: 0,
      max: 40,
      step: 1,
      default: 7,
      description: "Amplitude",
      hiddenFromList: false,
    },
    scale: {
      type: "number",
      min: 0.2,
      max: 4,
      step: 0.1,
      default: 1,
      description: "Scale",
      hiddenFromList: false,
    },
    speed: {
      type: "number",
      min: 1,
      max: 8,
      step: 1,
      default: 2,
      description: "Cycles",
      hiddenFromList: false,
    },
    dispersion: {
      type: "number",
      min: 0,
      max: 4,
      step: 0.1,
      default: 1,
      description: "Dispersion",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#06171c" },
  snippet: underwaterRippleExampleCode,
};
