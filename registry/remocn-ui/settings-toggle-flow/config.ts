import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const settingsToggleFlowConfig: ComponentConfig = {
  componentName: "SettingsToggleFlow",
  importPath: "@/components/remocn/settings-toggle-flow",
  controls: {},
  durationInFrames: 320,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(0.97 0 0)" },
};
