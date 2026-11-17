import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    dropLabel: {
      type: "text-content",
      default: "Drag and drop a file, or",
      description: "Drop label",
    },
    releaseLabel: {
      type: "text-content",
      default: "Release to upload",
      description: "Release label",
    },
    doneLabel: {
      type: "text-content",
      default: "Uploaded",
      description: "Done label",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Instrument Sans" }),
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
  durationInFrames: 162,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
