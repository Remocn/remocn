import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    prompt: {
      type: "text-content",
      default: "Drop files here or",
      description: "Prompt",
    },
    releaseLabel: {
      type: "text-content",
      default: "Release to upload",
      description: "Release label",
    },
    hint: {
      type: "text-content",
      default: "PDF, PNG or CSV, up to 50 MB",
      description: "Hint",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
