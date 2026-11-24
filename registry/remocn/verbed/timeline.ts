import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dictionary entry writing in: the headword, the pronunciation and the
// part-of-speech label, the noun sense word by word, the turn that adds
// "verb" and sets the noun sense back, the verb sense's number and words,
// the inflections, the example word by word and its forms of the word
// taking the accent. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type VerbedElementId =
  | "headword"
  | "pronunciation"
  | "label"
  | `noun:${number}`
  | "turn"
  | "number"
  | `verb:${number}`
  | "inflections"
  | `example:${number}`
  | "forms";

export interface VerbedTimingProps {
  nounSense?: string;
  verbSense?: string;
  inflections?: string[];
  example?: string;
  turnAt?: number;
  stagger?: number;
}

export const DEFAULT_NOUN_SENSE =
  "a set of video scenes you copy into your repo and edit like any other code.";
export const DEFAULT_VERB_SENSE =
  "to make the launch film in the same pull request as the feature.";
export const DEFAULT_INFLECTIONS = ["remocns", "remocned", "remocning"];
export const DEFAULT_EXAMPLE = "We remocned the changelog before lunch.";

const MOTION_END = 168;

export function splitWords(s: string) {
  return s.trim().split(/\s+/).filter(Boolean);
}

/** The example in curly quotes, whatever quotes it came with. */
export function curly(s: string) {
  const body = s
    .trim()
    .replace(/^["“”]+/, "")
    .replace(/["“”]+$/, "");
  return `“${body}”`;
}

// The entry is timed for a 200-frame clip and paced to fit the clip it gets:
// `length` here is the clip length without `speed`, as the pace is counted,
// and every number is multiplied by the pace. `noun:<i>`, `verb:<i>` and
// `example:<i>` are the words of each sense, each a chain; the verb sense
// follows the turn, the example follows the inflections. The inflections'
// lines rise `stagger` apart, `line` frames each.
export const verbedTimeline = defineTimeline<
  VerbedElementId,
  VerbedTimingProps
>(
  (
    {
      nounSense = DEFAULT_NOUN_SENSE,
      verbSense = DEFAULT_VERB_SENSE,
      inflections = DEFAULT_INFLECTIONS,
      example = DEFAULT_EXAMPLE,
      turnAt = 84,
      stagger = 2,
    },
    { length },
  ) => {
    const T = length;
    const tail = Math.max(30, T * 0.16);
    const pace = Math.min(1.5, Math.max(0.5, (T - tail) / MOTION_END));

    const nounWords = splitWords(nounSense);
    const verbWords = splitWords(verbSense);
    const exampleWords = splitWords(curly(example));
    const hasInflections = inflections.some((w) => w.trim() !== "");

    const TURN = turnAt;
    const nounStart = 20;
    const verbStart = TURN + 12;
    const inflStart = verbStart + verbWords.length * stagger + 10;
    const exStart = inflStart + 14;

    const words = (
      list: string[],
      prefix: "noun" | "verb" | "example",
      lane: string,
      start: number,
      after?: VerbedElementId,
    ) =>
      list.map(
        (w, i): TimelineElement<VerbedElementId> => ({
          id: `${prefix}:${i}`,
          lane,
          label: w,
          start: (start + i * stagger) * pace,
          length: 14 * pace,
          follows: i > 0 ? `${prefix}:${i - 1}` : after,
        }),
      );

    const elements: TimelineElement<VerbedElementId>[] = [
      {
        id: "headword",
        lane: "Headword",
        label: "headword",
        start: 0,
        length: 20 * pace,
      },
      {
        id: "pronunciation",
        lane: "Headword",
        label: "pronunciation",
        start: 8 * pace,
        length: 16 * pace,
      },
      {
        id: "label",
        lane: "Headword",
        label: "label",
        start: 12 * pace,
        length: 16 * pace,
      },
      ...words(nounWords, "noun", "Noun sense", nounStart),
      {
        id: "turn",
        lane: "Turn",
        label: "noun, verb",
        start: TURN * pace,
        length: 18 * pace,
      },
      {
        id: "number",
        lane: "Verb sense",
        label: "2.",
        start: (TURN + 4) * pace,
        length: 18 * pace,
        follows: "turn",
      },
      ...words(verbWords, "verb", "Verb sense", verbStart, "turn"),
      {
        id: "inflections",
        lane: "Inflections",
        label: hasInflections ? inflections.join(" · ") : "inflections",
        start: inflStart * pace,
        length: 16 * pace,
        follows: verbWords.length > 0 ? `verb:${verbWords.length - 1}` : "turn",
        beats: { stagger: 3 * pace, line: 16 * pace },
      },
      ...words(exampleWords, "example", "Example", exStart, "inflections"),
      {
        id: "forms",
        lane: "Example",
        label: "forms of the word",
        start: (exStart + 12) * pace,
        length: 16 * pace,
        follows: "inflections",
      },
    ];
    return elements.sort((a, b) => a.start - b.start);
  },
);
