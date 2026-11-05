import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tableFilterConfig: ComponentConfig = {
  componentName: "TableFilter",
  importPath: "@/components/remocn/table-filter",
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
      default: "Companies",
      description: "Title",
    },
    filterAttribute: {
      type: "text-content",
      default: "Stage",
      description: "Filter attribute",
    },
    filterValue: {
      type: "text-content",
      default: "Closed-won",
      description: "Filter value",
    },
    bulkAction: {
      type: "text-content",
      default: "Add to sequence",
      description: "Bulk action",
    },
    workspace: {
      type: "text-content",
      default: "remocn",
      description: "Workspace",
    },
    selectCount: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Select count",
      hiddenFromList: false,
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
  durationInFrames: 220,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
