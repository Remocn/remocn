import type { Caption } from "@remotion/captions";

const word = (text: string, startMs: number, endMs: number): Caption => ({
  text,
  startMs,
  endMs,
  timestampMs: Math.round((startMs + endMs) / 2),
  confidence: 0.97,
});

export const CAPTION_FIXTURE: Caption[] = [
  word(" So", 300, 460),
  word(" here's", 460, 700),
  word(" the", 700, 820),
  word(" thing.", 820, 1240),
  word(" Most", 1700, 1960),
  word(" demo", 1960, 2240),
  word(" videos", 2240, 2680),
  word(" lose", 2680, 2960),
  word(" people", 2960, 3320),
  word(" in", 3320, 3420),
  word(" the", 3420, 3520),
  word(" first", 3520, 3820),
  word(" three", 3820, 4100),
  word(" seconds.", 4100, 4780),
  word(" Captions", 5400, 5920),
  word(" keep", 5920, 6140),
  word(" them", 6140, 6300),
  word(" watching,", 6300, 6860),
  word(" even", 6960, 7180),
  word(" with", 7180, 7320),
  word(" the", 7320, 7420),
  word(" sound", 7420, 7760),
  word(" off.", 7760, 8300),
];

export const CAPTION_FIXTURE_TEXT = CAPTION_FIXTURE.map((c) =>
  c.text.trim(),
).join(" ");

const LEAD_IN_MS = 300;

export function captionsFromText(text: string): Caption[] {
  const words = text.split(/\s+/).filter(Boolean);
  let cursor = LEAD_IN_MS;
  return words.map((w) => {
    const startMs = cursor;
    const endMs = startMs + 160 + w.length * 45;
    const pause = /[.!?]$/.test(w) ? 420 : /[,;:]$/.test(w) ? 140 : 0;
    cursor = endMs + pause;
    return word(` ${w}`, startMs, endMs);
  });
}

export function previewCaptions(text: string | undefined): Caption[] {
  if (text === undefined || text.trim() === CAPTION_FIXTURE_TEXT) {
    return CAPTION_FIXTURE;
  }
  return captionsFromText(text);
}

export function previewTailMs(holdMs: unknown): number {
  return Math.max(1000, (typeof holdMs === "number" ? holdMs : 600) + 400);
}

export function previewCaptionsDuration(
  text: string | undefined,
  fps: number,
  tailMs = 1000,
): number {
  const captions = previewCaptions(text);
  const last = captions[captions.length - 1];
  const endMs = (last ? last.endMs : 0) + tailMs;
  return Math.max(fps, Math.ceil((endMs / 1000) * fps));
}
