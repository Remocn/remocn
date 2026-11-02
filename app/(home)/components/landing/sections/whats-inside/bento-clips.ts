import type { ClipSpec } from "../hero/tiles/config";

export const BENTO_SLOTS = [
  "transitions",
  "captions",
  "backgrounds",
  "numbers",
  "productScenes",
  "logoStings",
] as const;

export type BentoSlot = (typeof BENTO_SLOTS)[number];

export type BentoClips = Record<BentoSlot, ClipSpec> & {
  typography: ClipSpec[];
};

function spec(
  name: string,
  background: string,
  end: ClipSpec["end"],
  props: Record<string, unknown> = {},
): ClipSpec {
  return {
    name,
    start: 0,
    zoom: 1,
    end,
    background,
    radius: 0.25,
    cut: "auto",
    props,
  };
}

/**
 * A launch-pack type beat: it paints its own dark backdrop and is laid out
 * for a 16:9 frame, so the remix plays it at native size, cover-cropped, as a
 * dark card like the family tiles below it.
 */
function type(name: string, props: Record<string, unknown>) {
  return spec(name, "#0A0A0B", "hold", { theme: "dark", ...props });
}

export const DEFAULT_BENTO: BentoClips = {
  typography: [
    type("weight-wave", { text: "Move." }),
    type("baseline-drop", { text: "Drop." }),
    type("kerning-snap", { word: "Snap." }),
    type("slit-scan", { word: "Faster.", caption: "" }),
    type("stack-letters", { word: "STACK" }),
  ],
  transitions: spec("tile-wave", "#0A0A0B", "hold", { theme: "dark" }),
  captions: spec("caption-karaoke", "#0E1012", "hold", {
    fontSize: 88,
    activeColor: "#E879F9",
  }),
  numbers: spec("growth-line", "#0A0A0B", "hold", { theme: "dark" }),
  productScenes: spec("multiplayer-cursors", "#efebe4", "hold"),
  logoStings: spec("logo-construct", "#F5F4F0", "hold", { theme: "light" }),
  backgrounds: spec("shader-mesh-gradient-dusk", "#1a1446", "run"),
};
