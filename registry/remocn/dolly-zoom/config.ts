import { dollyZoomExampleCode } from "@/components/docs/examples/dolly-zoom-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dollyZoomConfig: ComponentConfig = {
  componentName: "DollyZoom",
  importPath: "@/components/remocn/dolly-zoom",
  controls: {
    intensity: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.1,
      description: "Intensity",
      hiddenFromList: false,
    },
    reverse: { type: "boolean", default: false, description: "Reverse" },
    doorColor: { type: "color", default: "#E5322D", description: "Door" },
    figureColor: { type: "color", default: "#FFFFFF", description: "Figure" },
    lineColor: { type: "color", default: "#FFFFFF", description: "Lines" },
  },
  durationInFrames: 66,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0B0B0B" },
  snippet: dollyZoomExampleCode,
};
