import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const liveCodeCompilationConfig: ComponentConfig = {
  componentName: "LiveCodeCompilation",
  importPath: "@/components/remocn/live-code-compilation",
  controls: {
    accentColor: {
      type: "color",
      default: "#3b82f6",
      description: "Accent color",
    },
  },
  durationInFrames: 260,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
