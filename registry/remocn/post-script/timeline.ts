import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The sign-off rising word by word, the signature under it, the P.S. rising
// small below, the flip that shrinks the sign-off and hands the stage to the
// P.S., and the install line wiping in. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type PostScriptElementId =
  | `word:${number}`
  | "signature"
  | "ps"
  | "flip"
  | "install";

export interface PostScriptTimingProps {
  signoff?: string;
  signature?: string;
  install?: string;
  stagger?: number;
  flip?: number;
}

export const DEFAULT_SIGNOFF = "Thanks for watching.";
export const DEFAULT_SIGNATURE = "— the remocn team";
export const DEFAULT_INSTALL = "npx shadcn add @remocn/zoom-blur";
const STAGGER = 3;
const FLIP = 30;
const SO_START = 4;
const WORD_RISE = 18;
const SIG_GAP = 8;
const SIG_RISE = 16;
const PS_GAP = 14;
const PS_RISE = 16;
const INSTALL_LEAD = 2;
const WIPE = 22;

export const splitWords = (s: string) => s.split(/\s+/).filter(Boolean);

// `word:<i>` is word `i` of the sign-off; the words form a chain. The
// signature (when there is one) follows the last word, the P.S. follows the
// signature, the flip follows the P.S. and the install line (when there is
// one) follows the flip, starting just before it lands. `length` is the clip
// after `delay`, in scene frames: the flip lands at about a third of it.
export const postScriptTimeline = defineTimeline<
  PostScriptElementId,
  PostScriptTimingProps
>(
  (
    {
      signoff = DEFAULT_SIGNOFF,
      signature = DEFAULT_SIGNATURE,
      install = DEFAULT_INSTALL,
      stagger = STAGGER,
      flip = FLIP,
    },
    { length },
  ) => {
    const Tt = length;
    const soWords = splitWords(signoff);
    const soStart = SO_START;
    const soStagger = stagger;
    const sigAt = soStart + soWords.length * soStagger + SIG_GAP;
    const psAt = sigAt + (signature ? PS_GAP : 0);
    const flipAt = Math.max(psAt + 24, Math.min(Tt * 0.36, psAt + 48));
    const flipDur = flip;
    const installAt = flipAt + flipDur - INSTALL_LEAD;

    const elements: TimelineElement<PostScriptElementId>[] = soWords.map(
      (word, i): TimelineElement<PostScriptElementId> => ({
        id: `word:${i}`,
        lane: "Sign-off",
        label: word,
        start: soStart + i * soStagger,
        length: WORD_RISE,
        follows: i > 0 ? `word:${i - 1}` : undefined,
      }),
    );
    const lastWord: PostScriptElementId | undefined = soWords.length
      ? `word:${soWords.length - 1}`
      : undefined;
    if (signature) {
      elements.push({
        id: "signature",
        lane: "Sign-off",
        label: signature,
        start: sigAt,
        length: SIG_RISE,
        follows: lastWord,
      });
    }
    elements.push(
      {
        id: "ps",
        lane: "P.S.",
        label: "P.S.",
        start: psAt,
        length: PS_RISE,
        follows: signature ? "signature" : lastWord,
      },
      {
        id: "flip",
        lane: "P.S.",
        label: "flip",
        start: flipAt,
        length: flipDur,
        follows: "ps",
      },
    );
    if (install) {
      elements.push({
        id: "install",
        lane: "Install",
        label: install,
        start: installAt,
        length: WIPE,
        follows: "flip",
      });
    }
    return elements;
  },
);
