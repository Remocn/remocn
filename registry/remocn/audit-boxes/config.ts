import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const auditBoxesConfig: ComponentConfig = {
  componentName: "AuditBoxes",
  importPath: "@/components/remocn/audit-boxes",
  controls: {
    color: { type: "color", default: "#FB3748", description: "Marks" },
    background: {
      type: "color",
      default: "#EDEDEF",
      description: "Background",
    },
    counterLabel: {
      type: "text-content",
      default: "issues",
      description: "Counter label",
    },
    stagger: {
      type: "number",
      min: 1,
      max: 12,
      step: 1,
      default: 4,
      description: "Stagger",
      hiddenFromList: false,
    },
  },
  durationInFrames: 83,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#EDEDEF" },
  card: { fit: false },
};
