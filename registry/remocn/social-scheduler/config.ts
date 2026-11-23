import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const socialSchedulerConfig: ComponentConfig = {
  componentName: "SocialScheduler",
  importPath: "@/components/remocn/social-scheduler",
  lists: {
    networks: {
      default: ["Quill", "Guild"],
      description: "Networks",
      min: 2,
      max: 2,
    },
    days: {
      default: ["Mon 26", "Tue 27", "Wed 28", "Thu 29", "Fri 30"],
      description: "Days",
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
    text: {
      type: "text-content",
      default:
        "remocn 2.0 is live: 120 Remotion components you copy, paste and own. Your next launch video takes an afternoon, not a sprint.",
      description: "Post text",
    },
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    handle: {
      type: "text-content",
      default: "remocn",
      description: "Handle",
    },
    weekLabel: {
      type: "text-content",
      default: "Oct 26 – 30, 2026",
      description: "Week label",
    },
    composerTitle: {
      type: "text-content",
      default: "New post",
      description: "Composer title",
    },
    queueTitle: {
      type: "text-content",
      default: "Queue",
      description: "Queue title",
    },
    ctaLabel: {
      type: "text-content",
      default: "Schedule",
      description: "Schedule button",
    },
    pick: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Pick",
      hiddenFromList: false,
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
  durationInFrames: 228,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
