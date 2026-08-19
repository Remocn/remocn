import { asciiRenderExampleCode } from "@/components/docs/examples/ascii-render-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const asciiRenderConfig: ComponentConfig = {
  componentName: "AsciiRender",
  importPath: "@/components/remocn/ascii-render",
  controls: {
    glyphSize: {
      type: "number",
      min: 10,
      max: 64,
      step: 2,
      default: 26,
      description: "Glyph size",
      hiddenFromList: false,
    },
    charset: {
      type: "text-content",
      default: " .:-=+*#%@",
      description: "Charset",
    },
    colored: {
      type: "boolean",
      default: false,
      description: "Source colour",
    },
    ink: {
      type: "color",
      default: "#9dff9d",
      description: "Ink",
    },
    intensity: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 1,
      description: "Intensity",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: asciiRenderExampleCode,
};
