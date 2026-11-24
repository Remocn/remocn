import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

export type ShotAnswersElementId =
  | "ground"
  | `word:${number}`
  | "shot"
  | "morph"
  | `answer:${number}`;

export interface ShotAnswersTimingProps {
  question?: string;
  answer?: string;
  stagger?: number;
  answerAt?: number;
}

export const SHOT_QUESTION =
  "What if your launch video were just another pull request?";
export const SHOT_ANSWER = "Your launch video is just another pull request.";
const SHOT_STAGGER = 1.6;
const SHOT_ANSWER_AT = 58;

const keyOf = (word: string) =>
  word.toLowerCase().replace(/[^\p{L}\p{N}']/gu, "");

/**
 * Pairs the words two texts share, in order (longest common subsequence):
 * `aToB[i]` is the word of `b` that word `i` of `a` turns into, or -1.
 */
export function matchWords(a: string[], b: string[]) {
  const ka = a.map(keyOf);
  const kb = b.map(keyOf);
  const n = ka.length;
  const m = kb.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        ka[i] === kb[j] && ka[i] !== ""
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const aToB = new Array<number>(n).fill(-1);
  const bToA = new Array<number>(m).fill(-1);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (ka[i] === kb[j] && ka[i] !== "") {
      aToB[i] = j;
      bToA[j] = i;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return { aToB, bToA };
}

/** The pace the scene runs at to fit its clip: 1 at the default 140 frames. */
function shotAnswersPace(length: number) {
  return Math.min(1.6, Math.max(0.6, length / 140));
}

// The ground fades in, the question rises word by word (word:<i>) and the
// screenshot springs in beside it. At `answerAt` the question words the
// answer drops fall away (morph); the words both share glide to their place
// in the answer and the new ones blur in (answer:<j>), all following morph.
// The scene's beats scale with the clip length, so every number here does.
export const shotAnswersTimeline = defineTimeline<
  ShotAnswersElementId,
  ShotAnswersTimingProps
>(
  (
    {
      question = SHOT_QUESTION,
      answer = SHOT_ANSWER,
      stagger = SHOT_STAGGER,
      answerAt = SHOT_ANSWER_AT,
    },
    { length },
  ) => {
    const k = shotAnswersPace(length);
    const qWords = question.split(/\s+/).filter(Boolean);
    const aWords = answer.split(/\s+/).filter(Boolean);
    const { bToA } = matchWords(qWords, aWords);
    const MORPH = answerAt * k;

    const elements: TimelineElement<ShotAnswersElementId>[] = [
      { id: "ground", lane: "Ground", label: "Ground", start: 0, length: 14 },
    ];
    qWords.forEach((wd, i) => {
      elements.push({
        id: `word:${i}`,
        lane: "Question",
        label: wd,
        start: i * stagger * k,
        length: 12 * k,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      });
    });
    elements.push(
      {
        id: "shot",
        lane: "Shot",
        label: "Screenshot",
        start: 26 * k,
        length: 18 * k,
      },
      {
        id: "morph",
        lane: "Question",
        label: "Question falls away",
        start: MORPH,
        length: 8 * k,
      },
    );
    const answers = aWords.map(
      (wd, j): TimelineElement<ShotAnswersElementId> =>
        bToA[j] >= 0
          ? {
              id: `answer:${j}`,
              lane: "Answer",
              label: wd,
              start: MORPH + 6 * k + j * 0.6 * k,
              length: 20 * k,
              follows: "morph",
            }
          : {
              id: `answer:${j}`,
              lane: "Answer",
              label: wd,
              start: MORPH + 18 * k + j * 0.8 * k,
              length: 14 * k,
              follows: "morph",
            },
    );
    answers.sort((a, b) => a.start - b.start);
    return [...elements, ...answers].sort((a, b) => a.start - b.start);
  },
);
