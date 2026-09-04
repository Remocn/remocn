import { type ComponentConfig, FPS } from "@/lib/customizer-config";

export const imessageChatFlowConfig: ComponentConfig = {
  componentName: "ImessageChatFlow",
  importPath: "@/components/remocn/imessage-chat-flow",
  controls: {},
  durationInFrames: 360,
  fps: FPS,
  compositionWidth: 432,
  compositionHeight: 768,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
