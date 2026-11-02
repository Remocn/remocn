import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const timelineEditorConfig: ComponentConfig = {
  componentName: "TimelineEditor",
  importPath: "@/components/remocn/timeline-editor",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
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
    projectName: {
      type: "text-content",
      default: "Launch video",
      description: "Project name",
    },
    title: {
      type: "text-content",
      default: "Meet remocn",
      description: "Title",
    },
    audioName: {
      type: "text-content",
      default: "soundtrack.wav",
      description: "Audio name",
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
  durationInFrames: 360,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
