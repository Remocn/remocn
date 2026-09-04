import { type ComponentConfig, FPS } from "@/lib/customizer-config";

export const chatFlowConfig: ComponentConfig = {
  componentName: "ChatFlow",
  importPath: "@/components/remocn/chat-flow",
  controls: {},
  durationInFrames: 360,
  fps: FPS,
  compositionWidth: 432,
  compositionHeight: 768,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
};
