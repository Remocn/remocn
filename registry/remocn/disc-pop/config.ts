import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const discPopConfig: ComponentConfig = {
  componentName: "DiscPopDemo",
  importPath: "@/components/remocn/disc-pop",
  controls: {
    theme: {
      type: "text-content",
      default: "dark",
      description: "Theme",
    },
    prompt: {
      type: "text-content",
      default:
        "Make a launch film for our piano app: bold title, three product shots, calm ending.",
      description: "Prompt",
    },
    overline: {
      type: "text-content",
      default: "LAUNCH FILM · 01",
      description: "Overline",
    },
    title: {
      type: "text-content",
      default: "Keys, in an afternoon.",
      description: "Title",
    },
  },
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
