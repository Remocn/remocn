import { springSettleExampleCode } from "@/components/docs/examples/spring-settle-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const springSettleConfig: ComponentConfig = {
  componentName: "SpringSettleScenes",
  importPath: "@/components/remocn/spring-settle",
  controls: {
    enterScale: {
      type: "number",
      default: 1.24,
      min: 1,
      max: 1.8,
      step: 0.02,
      label: "Enter scale",
    },
    enterStagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 0.5,
      label: "Stagger",
    },
    exitScale: {
      type: "number",
      default: 0.84,
      min: 0.5,
      max: 1,
      step: 0.02,
      label: "Exit scale",
    },
    exitFrames: {
      type: "number",
      default: 6,
      min: 2,
      max: 24,
      step: 1,
      label: "Exit frames",
    },
  },
  durationInFrames: 213,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: springSettleExampleCode,
};
