import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The app window and the invite modal coming in, the cursor focusing the
// field, each email typed into a chip, the role picked, Send clicked, then
// the modal leaving, the chips flying up into the avatar pile and the toast.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type InviteTeamElementId =
  | "app"
  | "modal"
  | "camera"
  | "cursor"
  | "focus"
  | `email:${number}`
  | "select"
  | "role"
  | "send"
  | "done"
  | `fly:${number}`
  | "out"
  | "toast";

export interface InviteTeamTimingProps {
  emails?: string[];
}

export const DEFAULT_EMAILS = [
  "maya@kitebase.io",
  "leo@kitebase.io",
  "priya@kitebase.io",
];

const BEAT = { app: 0, modal: 6, cursor: 8, focus: 24, type: 28 };
/** A click presses from `pressIn` and releases at `pressOut`, around its frame. */
const PRESS = { pressIn: -2, pressOut: 3 };

// `app` fades the app window in over its length. `modal` brings the modal in,
// fading over `fade` while the page dims over its length. `camera` is the
// push-in. `cursor` fades the cursor in over `fadeIn` and sends it to the
// field. `focus` clicks the field: its ring shows over `ring`, the cursor
// hides from `hideAt` over `hide`, and with no emails the typing would end
// at `empty`. `email:<i>` types email `i` over `type` and pops it into a chip
// at its end (a chain). `select` clicks the role select (the cursor shows
// again from `showAt` over `show` and leaves for it at `legAt`, the field's
// ring goes from `ringOutAt` over `ringOut`, the list opens at `openAt`);
// `role` picks the role (cursor leaves at `legAt`, the list closes from
// `closeAt` over `close`); `send` clicks the button (cursor leaves at
// `legAt`, the spinner from `loadingAt`); `done` shows the sent state. `out`
// takes the modal away over its length, the dim over `dim`, the camera back
// from `camAt` over `cam`, the cursor off at `exitAt`. `fly:<j>` flies chip
// `j` up to the avatar pile, landing at its end. `toast` pops the toast.
export const inviteTeamTimeline = defineTimeline<
  InviteTeamElementId,
  InviteTeamTimingProps
>(({ emails = DEFAULT_EMAILS }) => {
  const list = emails.slice(0, 3);
  const n = list.length;
  const typeStart: number[] = [];
  const chipAt: number[] = [];
  list.forEach((e, i) => {
    typeStart.push(i === 0 ? BEAT.type : chipAt[i - 1] + 4);
    chipAt.push(typeStart[i] + Math.ceil(e.length / 2) + 2);
  });
  const typedEnd = chipAt[n - 1] ?? BEAT.type + 6;
  const selClick = typedEnd + 14;
  const optClick = selClick + 14;
  const btnClick = optClick + 16;
  const doneAt = btnClick + 18;
  const outAt = doneAt + 8;
  const flyAt = list.map((_, j) => outAt - 2 + j * 3);
  const landAt = flyAt.map((f) => f + 12);
  const toastAt = (landAt[n - 1] ?? outAt) + 4;

  const elements: TimelineElement<InviteTeamElementId>[] = [
    {
      id: "app",
      lane: "App",
      label: "App",
      start: BEAT.app,
      length: 10,
    },
    {
      id: "modal",
      lane: "App",
      label: "Modal",
      start: BEAT.modal,
      length: 12,
      beats: { fade: 8 },
    },
    { id: "camera", lane: "Camera", label: "Push-in", start: 8, length: 70 },
    {
      id: "cursor",
      lane: "Cursor",
      label: "Cursor",
      start: BEAT.cursor,
      length: BEAT.focus - BEAT.cursor,
      beats: { fadeIn: 5 },
    },
    {
      id: "focus",
      lane: "Cursor",
      label: "Focus the field",
      start: BEAT.focus,
      length: BEAT.type - BEAT.focus,
      follows: "cursor",
      beats: {
        ...PRESS,
        ring: 4,
        hideAt: BEAT.type + 2 - BEAT.focus,
        hide: 4,
        empty: BEAT.type + 6 - BEAT.focus,
      },
    },
  ];
  list.forEach((email, i) => {
    elements.push({
      id: `email:${i}`,
      lane: "Emails",
      label: email,
      start: typeStart[i],
      length: chipAt[i] - typeStart[i],
      follows: i > 0 ? `email:${i - 1}` : "focus",
      beats: { type: Math.ceil(email.length / 2) },
    });
  });
  const lastEmail = n > 0 ? (`email:${n - 1}` as const) : "focus";
  elements.push(
    {
      id: "select",
      lane: "Cursor",
      label: "Open the role select",
      start: selClick,
      length: optClick - selClick,
      follows: lastEmail,
      beats: {
        ...PRESS,
        showAt: typedEnd + 2 - selClick,
        show: 5,
        legAt: -16,
        ringOutAt: -2,
        ringOut: 4,
        openAt: 1,
      },
    },
    {
      id: "role",
      lane: "Cursor",
      label: "Pick the role",
      start: optClick,
      length: btnClick - optClick,
      follows: "select",
      beats: { ...PRESS, legAt: -13, closeAt: 1, close: 6 },
    },
    {
      id: "send",
      lane: "Cursor",
      label: "Send",
      start: btnClick,
      length: doneAt - btnClick,
      follows: "role",
      beats: { ...PRESS, legAt: -15, loadingAt: 2 },
    },
    {
      id: "done",
      lane: "Cursor",
      label: "Sent",
      start: doneAt,
      length: outAt - doneAt,
      follows: "send",
    },
  );
  if (n > 0) {
    elements.push({
      id: "fly:0",
      lane: "Chips",
      label: list[0],
      start: flyAt[0],
      length: landAt[0] - flyAt[0],
      follows: "done",
    });
  }
  elements.push({
    id: "out",
    lane: "App",
    label: "Modal out",
    start: outAt,
    length: 7,
    follows: "done",
    beats: { dim: 10, camAt: -4, cam: 28, exitAt: 2 },
  });
  flyAt.forEach((at, j) => {
    if (j === 0) return;
    elements.push({
      id: `fly:${j}`,
      lane: "Chips",
      label: list[j],
      start: at,
      length: landAt[j] - at,
      follows: `fly:${j - 1}`,
    });
  });
  elements.push({
    id: "toast",
    lane: "Toast",
    label: "Toast",
    start: toastAt,
    length: 6,
    follows: n > 0 ? `fly:${n - 1}` : "out",
  });
  return elements;
});
