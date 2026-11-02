import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const fileDropzoneConfig: ComponentConfig = {
  componentName: "FileDropzone",
  importPath: "@/components/remocn/file-dropzone",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
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
      default: "Upload files",
      description: "Title",
    },
    destination: {
      type: "text-content",
      default: "Research",
      description: "Destination",
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 195,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
