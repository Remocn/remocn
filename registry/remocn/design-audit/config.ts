import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const designAuditConfig: ComponentConfig = {
  componentName: "DesignAudit",
  importPath: "@/components/remocn/design-audit",
  controls: {
    brand: { type: "text-content", default: "Synergy", description: "Brand" },
    auditColor: { type: "color", default: "#FB3748", description: "Audit" },
    fixColor: { type: "color", default: "#335CFF", description: "Fix" },
    scanColor: { type: "color", default: "#7D52F4", description: "Scan" },
    background: {
      type: "color",
      default: "#EDEDEF",
      description: "Background",
    },
  },
  durationInFrames: 340,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#EDEDEF" },
  card: { fit: false },
};
