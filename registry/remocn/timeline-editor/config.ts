import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    tagline: {
      type: "text-content",
      default: "Launch videos, built in code",
      description: "Tagline",
    },
    headline: {
      type: "text-content",
      default: "Ship your launch video",
      description: "Headline",
    },
    url: {
      type: "text-content",
      default: "remocn.dev",
      description: "URL",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Hanken Grotesk" }),
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
  // Does not hold 60 fps in the browser yet (`audit:playback`: script).
  previewFps: 30,
  compositionWidth: W,
  compositionHeight: H,
};
