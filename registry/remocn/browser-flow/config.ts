import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const browserFlowConfig: ComponentConfig = {
  componentName: "BrowserFlow",
  importPath: "@/components/remocn/browser-flow",
  controls: {
    url: {
      type: "text",
      default: "remocn.dev",
      label: "URL",
    },
  },
  durationInFrames: 270,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: {
    type: "gradient",
    value: "radial-gradient(ellipse at center, #11141c 0%, #050505 75%)",
  },
};
