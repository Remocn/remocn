import { cameraMoveExampleCode } from "@/components/docs/examples/camera-move-example";
import {
  type ComponentConfig,
  enumVariants,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const cameraMoveConfig: ComponentConfig = {
  componentName: "Camera",
  importPath: "@/components/remocn/camera-move",
  controls: {
    preset: {
      type: "enum",
      default: "three-beat",
      variants: enumVariants(["push-in", "orbit", "three-beat"]),
      description: "Storyboard",
    },
    shake: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.18,
      description: "Handheld shake",
      hiddenFromList: false,
    },
    seed: {
      type: "text-content",
      default: "remocn-camera",
      description: "Shake seed",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  snippet: cameraMoveExampleCode,
};
