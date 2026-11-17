import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const urlBarCtaConfig: ComponentConfig = {
  componentName: "UrlBarCta",
  importPath: "@/components/remocn/url-bar-cta",
  lists: {
    navLinks: {
      default: ["Components", "Templates", "Docs"],
      description: "Nav links",
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
    url: {
      type: "text-content",
      default: "remocn.dev",
      description: "Url",
    },
    suggestionTitle: {
      type: "text-content",
      default: "Launch videos from components",
      description: "Suggestion title",
    },
    headline: {
      type: "text-content",
      default: "Ship your launch video this afternoon.",
      description: "Headline",
    },
    body: {
      type: "text-content",
      default:
        "Remotion components you install with one command and own the code.",
      description: "Body",
    },
    cta: {
      type: "text-content",
      default: "Browse components",
      description: "Cta",
    },
    command: {
      type: "text-content",
      default: "npx shadcn add remocn/zoom-blur",
      description: "Command",
    },
    clipName: {
      type: "text-content",
      default: "Zoom Blur",
      description: "Clip name",
    },
    navCta: {
      type: "text-content",
      default: "Get started",
      description: "Nav button",
    },
    showCursor: {
      type: "boolean",
      default: true,
      description: "Show cursor",
    },
    typingSpeed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Typing speed",
      hiddenFromList: false,
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
