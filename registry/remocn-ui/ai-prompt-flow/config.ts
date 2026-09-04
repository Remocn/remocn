import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const aiPromptFlowConfig: ComponentConfig = {
  componentName: "AiPromptFlow",
  importPath: "@/components/remocn/ai-prompt-flow",
  controls: {},
  durationInFrames: 230,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
};
