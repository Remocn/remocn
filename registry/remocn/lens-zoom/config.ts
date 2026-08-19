import { lensZoomExampleCode } from "@/components/docs/examples/lens-zoom-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const lensZoomConfig: ComponentConfig = {
  componentName: "lensZoom",
  importPath: "@/components/remocn/lens-zoom",
  controls: {
    lensSteps: {
      type: "number",
      min: 4,
      max: 32,
      step: 1,
      default: 9,
      description: "Lens steps",
      hiddenFromList: false,
    },
    blurSamples: {
      type: "number",
      min: 2,
      max: 32,
      step: 1,
      default: 7,
      description: "Blur samples",
      hiddenFromList: false,
    },
    shakeAmount: {
      type: "number",
      min: 0,
      max: 300,
      step: 5,
      default: 50,
      description: "Shake amount",
      hiddenFromList: false,
    },
    shakeTranslatePx: {
      type: "number",
      min: 0,
      max: 80,
      step: 1,
      default: 73,
      description: "Shake travel (px)",
      hiddenFromList: false,
    },
  },
  durationInFrames: 112,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: lensZoomExampleCode,
};
