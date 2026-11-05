import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const roadmapTimelineConfig: ComponentConfig = {
  componentName: "RoadmapTimeline",
  importPath: "@/components/remocn/roadmap-timeline",
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
    today: {
      type: "text-content",
      default: "Aug 26",
      description: "Today",
    },
    dragProject: {
      type: "text-content",
      default: "Public API",
      description: "Drag project",
    },
    title: {
      type: "text-content",
      default: "Roadmap · H2 2026",
      description: "Title",
    },
    workspace: {
      type: "text-content",
      default: "remocn",
      description: "Workspace",
    },
    dragDays: {
      type: "number",
      default: 14,
      min: 0,
      max: 42,
      step: 1,
      description: "Drag days",
      hiddenFromList: false,
    },
    startMonth: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Start month",
      hiddenFromList: false,
    },
    monthCount: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Month count",
      hiddenFromList: false,
    },
    year: {
      type: "number",
      default: 2026,
      min: 0,
      max: 6078,
      step: 1,
      description: "Year",
      hiddenFromList: false,
    },
  },
  durationInFrames: 190,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
