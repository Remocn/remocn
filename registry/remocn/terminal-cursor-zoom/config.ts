import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const terminalCursorZoomConfig: ComponentConfig = {
  componentName: "TerminalCursorZoom",
  importPath: "@/components/remocn/terminal-cursor-zoom",
  controls: {
    command: {
      type: "text-content",
      default: "npx shadcn add @remocn/terminal-cursor-zoom",
      description: "Command",
    },
    zoom: {
      type: "number",
      min: 1,
      max: 4,
      step: 0.1,
      default: 2.8,
      description: "Zoom",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      min: 10,
      max: 32,
      step: 1,
      default: 20,
      description: "Font size",
      hiddenFromList: false,
    },
    prompt: {
      type: "text-content",
      default: "$",
      description: "Prompt",
    },
    title: {
      type: "text-content",
      default: "~/code/remocn-demo",
      description: "Title",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0B0B0C" },
};
