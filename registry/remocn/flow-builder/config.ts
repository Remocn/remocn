import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const flowBuilderConfig: ComponentConfig = {
  componentName: "FlowBuilder",
  importPath: "@/components/remocn/flow-builder",
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
      default: "Welcome new signups",
      description: "Title",
    },
    workspace: {
      type: "text-content",
      default: "remocn",
      description: "Workspace",
    },
    toast: {
      type: "text-content",
      default: "Live · runs on every signup",
      description: "Toast",
    },
    publishLabel: {
      type: "text-content",
      default: "Publish",
      description: "Publish label",
    },
    publishedLabel: {
      type: "text-content",
      default: "Published",
      description: "Published label",
    },
    stagger: {
      type: "number",
      default: 6,
      min: 0,
      max: 12,
      step: 1,
      description: "Node stagger",
      hiddenFromList: false,
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
  durationInFrames: 205,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
