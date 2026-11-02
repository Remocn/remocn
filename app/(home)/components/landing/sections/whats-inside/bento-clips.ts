import type { ClipSpec } from "../hero/tiles/config";

export const BENTO_SLOTS = [
  "transitions",
  "captions",
  "filters",
  "backgrounds",
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

function word(name: string, text: string, props: Record<string, unknown> = {}) {
  return spec(name, "transparent", "hold", {
    text,
    fontSize: 200,
    fontWeight: 600,
    color: "currentColor",
    ...props,
  });
}

export const DEFAULT_BENTO: BentoClips = {
  typography: [
    word("soft-blur-in", "Arrive.", { blur: 24 }),
    word("per-character-rise", "Rise."),
    word("mask-reveal-up", "Reveal."),
    word("tracking-in", "Track."),
    word("squeeze-in", "Squeeze."),
  ],
  transitions: spec("zoom-blur", "#141318", "hold"),
  captions: spec("caption-karaoke", "#0E1012", "hold", {
    fontSize: 88,
    activeColor: "#E879F9",
  }),
  filters: spec("crt-wordmark", "#050505", "hold"),
  backgrounds: spec("shader-mesh-gradient", "#3B0764", "run", {
    colors: ["#A800B7", "#F5D0FE", "#3B0764", "#E879F9"],
    distortion: 0.8,
    swirl: 0.3,
  }),
};
