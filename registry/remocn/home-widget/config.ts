import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const homeWidgetConfig: ComponentConfig = {
  componentName: "HomeWidget",
  importPath: "@/components/remocn/home-widget",
  lists: {
    lines: {
      default: [
        "Hold the home screen.",
        "Pick the size that fits.",
        "Your week, one glance away.",
      ],
      description: "Lines",
      min: 3,
      max: 3,
    },
  },
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
    appName: {
      type: "text-content",
      default: "remocn",
      description: "App name",
    },
    widgetName: {
      type: "text-content",
      default: "Renders",
      description: "Widget name",
    },
    widgetDescription: {
      type: "text-content",
      default: "Track renders and views at a glance.",
      description: "Widget description",
    },
    size: {
      type: "enum",
      default: "medium",
      variants: {
        small: {},
        medium: {},
      },
      description: "Size",
    },
    searchLabel: {
      type: "text-content",
      default: "Search Widgets",
      description: "Search label",
    },
    addLabel: {
      type: "text-content",
      default: "Add Widget",
      description: "Add button",
    },
    doneLabel: {
      type: "text-content",
      default: "Done",
      description: "Done button",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Onest" }),
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
  durationInFrames: 290,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
