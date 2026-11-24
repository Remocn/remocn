import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The prompt is typed and sent, the assistant thinks, writes its plan and
// builds four files while the preview fills in, says it's done, then the
// cursor clicks Deploy and the site goes live. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type PromptToAppElementId =
  | "prompt"
  | "send"
  | "think"
  | "plan"
  | `file:${number}`
  | "done"
  | "cursor"
  | "deploy"
  | "live";

export interface PromptToAppTimingProps {
  prompt?: string;
  plan?: string;
  files?: string[];
  doneMessage?: string;
  deployUrl?: string;
}

export const DEFAULT_PROMPT =
  "Build a landing page for Fernway, a neighborhood wine bar. Warm and editorial, with tonight’s pours and a booking button.";
export const DEFAULT_PLAN =
  "I’ll build a one-page site for Fernway: a sticky nav, an editorial hero with a booking CTA, and a card grid for tonight’s pours.";
export const DEFAULT_FILES = [
  "components/Nav.tsx",
  "components/Hero.tsx",
  "components/PourCards.tsx",
  "app/page.tsx",
];
export const DEFAULT_DONE_MESSAGE =
  "Fernway is ready. The booking button links to your reservations page.";
export const DEFAULT_DEPLOY_URL = "fernway.remocn.app";

/** Typing starts at `type` and runs at `cps` characters a frame. */
export const TYPING = {
  type: 12,
  cps: 2.3,
};
/** Frames between plan words appearing. */
const PLAN_WORD = 1.3;
/** Frames a file takes to build, and from one file to the next. */
const FILE_BUILD = 20;
const FILE_STEP = 24;

/** The scene's beats for a prompt and plan of this size. */
export function promptToAppPlan(promptLen: number, planWords: number) {
  const typeEnd = TYPING.type + promptLen / TYPING.cps;
  const send = typeEnd + 6;
  const think = send + 6;
  const planAt = think + 16;
  const planEnd = planAt + planWords * PLAN_WORD;
  const file = (i: number) => {
    const s = planEnd + 4 + i * FILE_STEP;
    return { start: s, done: s + FILE_BUILD };
  };
  const doneMsg = file(3).done + 4;
  const cursorIn = doneMsg + 4;
  const deployClick = cursorIn + 22;
  const deployed = deployClick + 24;
  return {
    typeEnd,
    send,
    think,
    planAt,
    planEnd,
    file,
    doneMsg,
    cursorIn,
    deployClick,
    deployed,
    end: deployed + 40,
  };
}

// The prompt types over its own length; send, think and the plan follow it.
// A file runs until the next starts (`done` is when it's built). The cursor
// glides in to Deploy, the deploy runs until the site is live, and the live
// site holds while the camera finishes its push.
export const promptToAppTimeline = defineTimeline<
  PromptToAppElementId,
  PromptToAppTimingProps
>(
  ({
    prompt = DEFAULT_PROMPT,
    plan = DEFAULT_PLAN,
    files = DEFAULT_FILES,
    doneMessage = DEFAULT_DONE_MESSAGE,
    deployUrl = DEFAULT_DEPLOY_URL,
  }) => {
    const p = promptToAppPlan(prompt.length, plan.split(" ").length);
    const elements: TimelineElement<PromptToAppElementId>[] = [
      {
        id: "prompt",
        lane: "Chat",
        label: prompt,
        start: TYPING.type,
        length: prompt.length / TYPING.cps,
      },
      {
        id: "send",
        lane: "Chat",
        label: "Send",
        start: p.send,
        length: p.think - p.send,
        follows: "prompt",
      },
      {
        id: "think",
        lane: "Chat",
        label: "Thinking",
        start: p.think,
        length: p.planAt - p.think,
        follows: "send",
      },
      {
        id: "plan",
        lane: "Chat",
        label: plan,
        start: p.planAt,
        length: p.planEnd - p.planAt,
        follows: "think",
        beats: { word: PLAN_WORD },
      },
    ];
    for (let i = 0; i < 4; i++) {
      const f = p.file(i);
      elements.push({
        id: `file:${i}`,
        lane: "Files",
        label: files[i] ?? DEFAULT_FILES[i],
        start: f.start,
        length: FILE_STEP,
        follows: i > 0 ? `file:${i - 1}` : "plan",
        beats: { done: FILE_BUILD },
      });
    }
    elements.push(
      {
        id: "done",
        lane: "Chat",
        label: doneMessage,
        start: p.doneMsg,
        length: p.cursorIn - p.doneMsg,
        follows: "file:3",
      },
      {
        id: "cursor",
        lane: "Deploy",
        label: "Cursor to Deploy",
        start: p.cursorIn,
        length: p.deployClick - p.cursorIn,
        follows: "done",
      },
      {
        id: "deploy",
        lane: "Deploy",
        label: "Deploying",
        start: p.deployClick,
        length: p.deployed - p.deployClick,
        follows: "cursor",
      },
      {
        id: "live",
        lane: "Deploy",
        label: deployUrl,
        start: p.deployed,
        length: p.end - p.deployed,
        follows: "deploy",
      },
    );
    return elements;
  },
);
