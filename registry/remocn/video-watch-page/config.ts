import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const videoWatchPageConfig: ComponentConfig = {
  componentName: "VideoWatchPage",
  importPath: "@/components/remocn/video-watch-page",
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
      default: "Introducing remocn 2.0",
      description: "Title",
    },
    breadcrumb: {
      type: "text-content",
      default: "Launch videos",
      description: "Breadcrumb",
    },
    description: {
      type: "text-content",
      default: "Kinetic captions, 40+ transitions, one install command.",
      description: "Description",
    },
    published: {
      type: "text-content",
      default: "3 hours ago",
      description: "Published",
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
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
