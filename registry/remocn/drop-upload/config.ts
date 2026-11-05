import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dropUploadConfig: ComponentConfig = {
  componentName: "DropUpload",
  importPath: "@/components/remocn/drop-upload",
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
    title: {
      type: "text-content",
      default: "Drop in your launch notes",
      description: "Title",
    },
    fileName: {
      type: "text-content",
      default: "launch-notes.md",
      description: "File name",
    },
    fileKind: {
      type: "text-content",
      default: "MD",
      description: "File kind",
    },
    fileSize: {
      type: "text-content",
      default: "2.4 MB",
      description: "File size",
    },
    hint: {
      type: "text-content",
      default: "MD, PDF or ZIP · up to 50 MB",
      description: "Hint",
    },
  },
  durationInFrames: 162,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
