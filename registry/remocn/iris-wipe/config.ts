import { irisWipeExampleCode } from "@/components/docs/examples/iris-wipe-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const irisWipeConfig: ComponentConfig = {
  componentName: "irisWipe",
  importPath: "@/components/remocn/iris-wipe",
  controls: {
    color: { type: "color", default: "#000000", description: "Iris color" },
    centerX: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      description: "Center X",
      hiddenFromList: false,
    },
    centerY: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      description: "Center Y",
      hiddenFromList: false,
    },
    holdRadius: {
      type: "number",
      min: 0,
      max: 40,
      step: 1,
      default: 12,
      description: "Hold radius",
      hiddenFromList: false,
    },
  },
  durationInFrames: 104,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#efe9dc" },
  snippet: irisWipeExampleCode,
};
