import { springSettleExampleCode } from "@/components/docs/examples/spring-settle-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const springSettleConfig: ComponentConfig = {
  componentName: "SpringSettleScenes",
  importPath: "@/components/remocn/spring-settle",
  controls: {
    enterScale: {
      type: "number",
      min: 1,
      max: 1.8,
      step: 0.02,
      default: 1.24,
      description: "Enter scale",
      hiddenFromList: false,
    },
    enterStagger: {
      type: "number",
      min: 0,
      max: 10,
      step: 0.5,
      default: 3,
      description: "Stagger",
      hiddenFromList: false,
    },
    exitScale: {
      type: "number",
      min: 0.5,
      max: 1,
      step: 0.02,
      default: 0.84,
      description: "Exit scale",
      hiddenFromList: false,
    },
    exitFrames: {
      type: "number",
      min: 2,
      max: 24,
      step: 1,
      default: 6,
      description: "Exit frames",
      hiddenFromList: false,
    },
  },
  durationInFrames: 213,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: springSettleExampleCode,
};
