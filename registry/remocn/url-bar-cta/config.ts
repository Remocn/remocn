import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const urlBarCtaConfig: ComponentConfig = {
  componentName: "UrlBarCta",
  importPath: "@/components/remocn/url-bar-cta",
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
    showCursor: {
      type: "boolean",
      default: true,
      description: "Show cursor",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
