import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dragAndDropFlowConfig: ComponentConfig = {
  componentName: "DragAndDropFlow",
  importPath: "@/components/remocn/drag-and-drop-flow",
  controls: {
    accent: { type: "color", default: "#0ea5e9", label: "Accent" },
    dropzoneLabel: {
      type: "text",
      default: "Drop file to upload",
      label: "Dropzone label",
    },
    fileName: { type: "text", default: "design.fig", label: "File name" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#fafafa" },
};
