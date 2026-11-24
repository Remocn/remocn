import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The lines rising in one after another in flat mono, the letters finding
// their voice one by one, and the block refitting to its voiced width.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type MonoVoiceElementId = "rise" | "voice" | "refit";

export interface MonoVoiceTimingProps {
  text?: string;
  /** Frame the mono letters start finding their voice. */
  voiceAt?: number;
  /** Frames between lines rising in. */
  stagger?: number;
}

export const DEFAULT_TEXT = "Same script.\nA whole new\ndelivery.";
const RISE_AT = 0;
const RISE_LEN = 16;
const RISE_GAP = 4;
const VOICE_AT = 28;
const VOICE_SPAN = 40;
const VOICE_MAX_GAP = 2.2;
/** The refit eases from this share of the voicing to 16 frames past it. */
const REFIT_FROM = 0.45;
const REFIT_TAIL = 16;

function wrap(text: string, maxChars: number) {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (cur && next.length > maxChars) {
        out.push(cur);
        cur = w;
      } else {
        cur = next;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

/** The lines as set: the paragraphs, wrapped when one is too long. */
export function monoVoiceLines(text: string, portrait: boolean) {
  const paras = text
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);
  const longest = Math.max(1, ...paras.map((p) => p.length));
  const maxChars = portrait ? 14 : 24;
  return longest > maxChars ? wrap(text, maxChars) : paras;
}

// The lines rise `stagger` apart, `rise` frames each; the schedule counts them
// as a landscape frame wraps them. The voicing starts at `voiceAt` and spreads
// over the glyphs, at most `maxGap` apart and within `span`. The refit
// follows the voicing.
export const monoVoiceTimeline = defineTimeline<
  MonoVoiceElementId,
  MonoVoiceTimingProps
>(({ text = DEFAULT_TEXT, voiceAt = VOICE_AT, stagger = RISE_GAP }) => {
  const lines = monoVoiceLines(text, false);
  const refitAt = voiceAt + VOICE_SPAN * REFIT_FROM;
  const elements: TimelineElement<MonoVoiceElementId>[] = [
    {
      id: "rise",
      lane: "Lines",
      label: "lines rise",
      start: RISE_AT,
      length: RISE_LEN + stagger * Math.max(0, lines.length - 1),
      beats: { stagger, rise: RISE_LEN },
    },
    {
      id: "voice",
      lane: "Voice",
      label: "find the voice",
      start: voiceAt,
      length: VOICE_SPAN,
      beats: { span: VOICE_SPAN, maxGap: VOICE_MAX_GAP },
    },
    {
      id: "refit",
      lane: "Refit",
      label: "refit",
      start: refitAt,
      length: voiceAt + VOICE_SPAN + REFIT_TAIL - refitAt,
      follows: "voice",
    },
  ];
  return elements.sort((a, b) => a.start - b.start);
});
