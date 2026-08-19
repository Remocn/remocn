import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const infiniteMarqueeConfig: ComponentConfig = {
  componentName: "InfiniteMarquee",
  importPath: "@/components/remocn/infinite-marquee",
  controls: {
    text: {
      type: "text-content",
      default: "ship · build · animate · ",
      description: "Text",
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 240,
      step: 1,
      default: 120,
      description: "Font size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "700",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
    pixelsPerFrame: {
      type: "number",
      min: 1,
      max: 30,
      step: 1,
      default: 4,
      description: "Pixels / frame",
      hiddenFromList: false,
    },
    stroke: {
      type: "boolean",
      default: false,
      description: "Stroke",
    },
    strokeColor: {
      type: "color",
      default: "#171717",
      description: "Stroke color",
    },
  },
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#fafafa" },
};
