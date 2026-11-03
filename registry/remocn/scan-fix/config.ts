import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const scanFixConfig: ComponentConfig = {
  componentName: "ScanFix",
  importPath: "@/components/remocn/scan-fix",
  controls: {
    brand: { type: "text-content", default: "Synergy", description: "Brand" },
    scanColor: { type: "color", default: "#7D52F4", description: "Scan" },
    beforeColor: { type: "color", default: "#FB3748", description: "Before" },
    afterColor: { type: "color", default: "#335CFF", description: "After" },
    background: {
      type: "color",
      default: "#EDEDEF",
      description: "Background",
    },
  },
  durationInFrames: 127,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#EDEDEF" },
  card: { fit: false },
};
