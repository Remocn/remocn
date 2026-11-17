import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const multiFileDropConfig: ComponentConfig = {
  componentName: "MultiFileDrop",
  importPath: "@/components/remocn/multi-file-drop",
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
    heading: {
      type: "text-content",
      default: "What are we launching?",
      description: "Heading",
    },
    prompt: {
      type: "text-content",
      default:
        "Build a launch page for v2 with a hero video, a pricing table and a waitlist.",
      description: "Prompt",
    },
    attachLabel: {
      type: "text-content",
      default: "Attach",
      description: "Attach label",
    },
    modeLabel: {
      type: "text-content",
      default: "Build",
      description: "Mode label",
    },
    totalSize: {
      type: "text-content",
      default: "3.4 MB",
      description: "Total size",
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
  durationInFrames: 144,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
