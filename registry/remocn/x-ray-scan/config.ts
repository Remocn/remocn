import { xRayScanExampleCode } from "@/components/docs/examples/x-ray-scan-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const xRayScanConfig: ComponentConfig = {
  componentName: "XRayScan",
  importPath: "@/components/remocn/x-ray-scan",
  controls: {
    direction: {
      type: "enum",
      default: "horizontal",
      variants: { horizontal: {}, vertical: {} },
      description: "Direction",
    },
    shell: { type: "color", default: "#E5322D", description: "Shell" },
    accent: { type: "color", default: "#E5322D", description: "Accent part" },
    line: { type: "color", default: "#FFFFFF", description: "Scan line" },
    background: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
  },
  durationInFrames: 65,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: xRayScanExampleCode,
};
