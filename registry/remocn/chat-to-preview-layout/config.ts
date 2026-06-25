import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const chatToPreviewLayoutConfig: ComponentConfig = {
  componentName: "ChatToPreviewLayout",
  importPath: "@/components/remocn/chat-to-preview-layout",
  controls: {
    startChatRatio: {
      type: "number",
      default: 0.5,
      min: 0.1,
      max: 0.9,
      step: 0.05,
      label: "Start chat ratio",
    },
    endChatRatio: {
      type: "number",
      default: 0.25,
      min: 0.05,
      max: 0.9,
      step: 0.05,
      label: "End chat ratio",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
