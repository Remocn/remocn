import { type ComponentConfig, FPS } from "@/lib/customizer-config";

export const telegramChatFlowConfig: ComponentConfig = {
  componentName: "TelegramChatFlow",
  importPath: "@/components/remocn/telegram-chat-flow",
  controls: {},
  durationInFrames: 360,
  fps: FPS,
  compositionWidth: 432,
  compositionHeight: 768,
  previewBackdrop: {
    type: "gradient",
    value: "linear-gradient(180deg, #cfe0ec 0%, #a7c6e0 100%)",
  },
};
