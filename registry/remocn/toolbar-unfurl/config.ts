import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const toolbarUnfurlConfig: ComponentConfig = {
  componentName: "ToolbarUnfurl",
  importPath: "@/components/remocn/toolbar-unfurl",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    finalLine: {
      type: "text-content",
      default: "Every tool, one tap away.",
      description: "Final line",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
