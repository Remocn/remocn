import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const promptToAppConfig: ComponentConfig = {
  componentName: "PromptToApp",
  importPath: "@/components/remocn/prompt-to-app",
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
    doneMessage: {
      type: "text-content",
      default:
        "Fernway is ready. The booking button links to your reservations page.",
      description: "Done message",
    },
    projectName: {
      type: "text-content",
      default: "fernway-site",
      description: "Project name",
    },
    deployUrl: {
      type: "text-content",
      default: "fernway.remocn.app",
      description: "Deploy url",
    },
    siteName: {
      type: "text-content",
      default: "Fernway",
      description: "Site name",
    },
    siteEyebrow: {
      type: "text-content",
      default: "Wine bar · Open late",
      description: "Site eyebrow",
    },
    siteHeadline: {
      type: "text-content",
      default: "Natural wine, small plates, one long table.",
      description: "Site headline",
    },
    siteBody: {
      type: "text-content",
      default:
        "Low-intervention bottles and seasonal plates in the Mission. Walk-ins welcome until 10.",
      description: "Site body",
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
  durationInFrames: 314,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
