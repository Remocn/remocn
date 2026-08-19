import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const matrixDecodeConfig: ComponentConfig = {
  componentName: "MatrixDecode",
  importPath: "@/components/remocn/matrix-decode",
  controls: {
    text: {
      type: "text-content",
      default: "DECRYPTED",
      description: "Text",
    },
    charset: {
      type: "text-content",
      default: "!@#$%^&*()_+-=<>?/\\|",
      description: "Charset",
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 160,
      step: 1,
      default: 72,
      description: "Font size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#22c55e",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "600",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
    revealDuration: {
      type: "number",
      min: 10,
      max: 240,
      step: 1,
      default: 60,
      description: "Reveal duration",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
