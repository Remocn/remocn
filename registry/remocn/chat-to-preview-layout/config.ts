import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const chatToPreviewLayoutConfig: ComponentConfig = {
  componentName: "ChatToPreviewLayout",
  importPath: "@/components/remocn/chat-to-preview-layout",
  controls: {
    startChatRatio: {
      type: "number",
      min: 0.1,
      max: 0.9,
      step: 0.05,
      default: 0.5,
      description: "Start chat ratio",
      hiddenFromList: false,
    },
    endChatRatio: {
      type: "number",
      min: 0.05,
      max: 0.9,
      step: 0.05,
      default: 0.25,
      description: "End chat ratio",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
