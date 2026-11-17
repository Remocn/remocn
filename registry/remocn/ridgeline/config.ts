import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const ridgelineConfig: ComponentConfig = {
  componentName: "Ridgeline",
  importPath: "@/components/remocn/ridgeline",
  lists: {
    labels: {
      default: ["2020", "2021", "2022", "2023", "2024", "2025"],
      description: "Row labels",
    },
    ticks: {
      default: ["0", "5", "10", "15", "20", "25", "30"],
      description: "Ticks",
    },
  },
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
    highlightLabel: {
      type: "text-content",
      default: "With remocn",
      description: "Highlight label",
    },
    value: {
      type: "text-content",
      default: "2.6×",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "more videos per team",
      description: "Caption",
    },
    axisLabel: {
      type: "text-content",
      default: "videos per team, per month",
      description: "Axis label",
    },
    stagger: {
      type: "number",
      default: 7,
      min: 0,
      max: 20,
      step: 1,
      description: "Ridge stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Bricolage Grotesque", grain: true }),
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
