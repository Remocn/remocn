import { crtScreenExampleCode } from "@/components/docs/examples/crt-screen-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const crtScreenConfig: ComponentConfig = {
  componentName: "CrtScreen",
  importPath: "@/components/remocn/crt-screen",
  controls: {
    curvature: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      default: 1,
      description: "Curvature",
      hiddenFromList: false,
    },
    scanlines: {
      type: "number",
      min: 0,
      max: 1.5,
      step: 0.05,
      default: 1,
      description: "Scanlines",
      hiddenFromList: false,
    },
    maskScale: {
      type: "number",
      min: 1,
      max: 6,
      step: 1,
      default: 2,
      description: "Mask pitch",
      hiddenFromList: false,
    },
    vignette: {
      type: "number",
      min: 0,
      max: 1.5,
      step: 0.05,
      default: 1,
      description: "Vignette",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: crtScreenExampleCode,
};
