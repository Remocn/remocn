import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The edge light coming up, the question rising in word by word, the light
// thinking with its pulses, the question dissolving, the light collapsing
// into the rule and narrowing to the answer, the answer resolving word by
// word and the logo under it. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type IntelligenceGlowElementId =
  | "intro"
  | `question:${number}`
  | "think"
  | `ripple:${number}`
  | "questionOut"
  | "squeeze"
  | "narrow"
  | `answer:${number}`
  | "logo";

export interface IntelligenceGlowTimingProps {
  question?: string;
  answerLead?: string;
  answer?: string;
  showLogo?: boolean;
  stagger?: number;
}

export const DEFAULT_QUESTION = "Make a launch film for Friday?";
export const DEFAULT_ANSWER_LEAD = "Done.";
export const DEFAULT_ANSWER = "14 shots, cut to the beat.";
export const A_STAGGER = 4;

const INTRO = 14;
const Q_IN = 2;
const Q_STAGGER = 3;
const Q_RISE = 14;
const THINK = 32;
const THINK_RAMP = 6;
const THINK_FADE = 8;
const RIPPLES = [36, 54];
const RIPPLE = 24;
const Q_OUT = 76;
const Q_OUT_LEN = 16;
const SQUEEZE = [80, 100] as const;
const RULE = [-9, 3] as const;
const NARROW = [88, 110] as const;
const A_IN = 100;
const A_RISE = 16;
const LOGO_IN = 132;
const LOGO_RISE = 16;

/** The question's words. */
export const questionWords = (question: string) =>
  question.split(" ").filter(Boolean);

/** The answer's words after the lead. */
export const answerWords = (answer: string) =>
  answer.split(" ").filter(Boolean);

// `question:<i>` and `answer:<i>` are single words rising in (the answer's
// lead word is `answer:0`); each list is a chain. `think` runs from the
// shimmer's start to the question leaving, ramping in over `rampIn` to
// `rampDone` and out over `fade` after its end. `ripple:<k>` is one pulse of
// the light. `squeeze` brings the bands to the rule, which draws in from
// `ruleIn` to `ruleDone`. `questionOut`, `squeeze` and the answer follow
// `think` in turn; `narrow` follows `squeeze`, the logo the answer.
export const intelligenceGlowTimeline = defineTimeline<
  IntelligenceGlowElementId,
  IntelligenceGlowTimingProps
>(
  ({
    question = DEFAULT_QUESTION,
    answerLead = DEFAULT_ANSWER_LEAD,
    answer = DEFAULT_ANSWER,
    showLogo = true,
    stagger = A_STAGGER,
  }) => {
    const elements: TimelineElement<IntelligenceGlowElementId>[] = [
      {
        id: "intro",
        lane: "Light",
        label: "light up",
        start: 0,
        length: INTRO,
      },
    ];
    questionWords(question).forEach((w, i) => {
      elements.push({
        id: `question:${i}`,
        lane: "Question",
        label: w,
        start: Q_IN + i * Q_STAGGER,
        length: Q_RISE,
        follows: i > 0 ? `question:${i - 1}` : undefined,
      });
    });
    elements.push({
      id: "think",
      lane: "Light",
      label: "thinking",
      start: THINK,
      length: Q_OUT - THINK,
      beats: { rampIn: -THINK_RAMP, rampDone: THINK_RAMP, fade: THINK_FADE },
    });
    RIPPLES.forEach((at, k) => {
      elements.push({
        id: `ripple:${k}`,
        lane: "Ripples",
        label: `pulse ${k + 1}`,
        start: at,
        length: RIPPLE,
        follows: k > 0 ? `ripple:${k - 1}` : undefined,
      });
    });
    elements.push(
      {
        id: "questionOut",
        lane: "Question",
        label: "question out",
        start: Q_OUT,
        length: Q_OUT_LEN,
        follows: "think",
      },
      {
        id: "squeeze",
        lane: "Light",
        label: "squeeze",
        start: SQUEEZE[0],
        length: SQUEEZE[1] - SQUEEZE[0],
        follows: "questionOut",
        beats: {
          ruleIn: SQUEEZE[1] - SQUEEZE[0] + RULE[0],
          ruleDone: SQUEEZE[1] - SQUEEZE[0] + RULE[1],
        },
      },
      {
        id: "narrow",
        lane: "Light",
        label: "narrow",
        start: NARROW[0],
        length: NARROW[1] - NARROW[0],
        follows: "squeeze",
      },
    );
    [answerLead, ...answerWords(answer)].forEach((w, i) => {
      elements.push({
        id: `answer:${i}`,
        lane: "Answer",
        label: w,
        start: A_IN + i * stagger,
        length: A_RISE,
        follows: i > 0 ? `answer:${i - 1}` : "squeeze",
      });
    });
    if (showLogo) {
      elements.push({
        id: "logo",
        lane: "Logo",
        label: "logo",
        start: LOGO_IN,
        length: LOGO_RISE,
        // The logo keeps its place against the answer's first word.
        follows: "answer:0",
      });
    }
    return elements.sort((a, b) => a.start - b.start);
  },
);
