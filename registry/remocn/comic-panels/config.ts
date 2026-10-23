import { comicPanelsExampleCode } from "@/components/docs/examples/comic-panels-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const comicPanelsConfig: ComponentConfig = {
  componentName: "ComicPanels",
  importPath: "@/components/remocn/comic-panels",
  controls: {
    word: { type: "text-content", default: "POW", description: "Word" },
    heroScale: {
      type: "number",
      default: 0.62,
      min: 0.3,
      max: 1,
      step: 0.02,
      description: "Hero scale",
      hiddenFromList: false,
    },
    ink: { type: "color", default: "#111111", description: "Ink" },
    paper: { type: "color", default: "#FFFFFF", description: "Paper" },
    accent: { type: "color", default: "#E5322D", description: "Accent" },
  },
  durationInFrames: 66,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#FFFFFF" },
  snippet: comicPanelsExampleCode,
};
