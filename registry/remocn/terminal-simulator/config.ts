import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const terminalSimulatorConfig: ComponentConfig = {
  componentName: "TerminalSimulator",
  importPath: "@/components/remocn/terminal-simulator",
  controls: {
    prompt: {
      type: "text-content",
      default: "$",
      description: "Prompt",
    },
    title: {
      type: "text-content",
      default: "~/projects/remocn",
      description: "Title",
    },
    background: {
      type: "color",
      default: "#0a0a0a",
      description: "Background",
    },
    chromeColor: {
      type: "color",
      default: "#1a1a1a",
      description: "Chrome color",
    },
    fontSize: {
      type: "number",
      min: 10,
      max: 32,
      step: 1,
      default: 18,
      description: "Font size",
      hiddenFromList: false,
    },
    charsPerFrame: {
      type: "number",
      min: 0.25,
      max: 6,
      step: 0.25,
      default: 1,
      description: "Chars / frame",
      hiddenFromList: false,
    },
    chunkSize: {
      type: "number",
      min: 1,
      max: 20,
      step: 1,
      default: 1,
      description: "Chunk size",
      hiddenFromList: false,
    },
  },
  durationInFrames: 240,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#050505" },
};
