import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const layoutGuidesConfig: ComponentConfig = {
  componentName: "LayoutGuides",
  importPath: "@/components/remocn/layout-guides",
  controls: {
    color: { type: "color", default: "#335CFF", description: "Guides" },
    nowColor: { type: "color", default: "#7D52F4", description: "Now line" },
    background: {
      type: "color",
      default: "#EDEDEF",
      description: "Background",
    },
  },
  durationInFrames: 81,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#EDEDEF" },
  card: { fit: false },
};
