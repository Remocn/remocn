import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The editor window rises in and the pointer drags each clip from the media
// bin onto V1, one after another, while the camera leans in. The title clip
// drops onto V2 and the audio onto A1, the pointer scrubs the playhead across
// the cut, clicks Export, and the export runs to done. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type TimelineEditorElementId =
  | "editor"
  | `clip:${number}`
  | "lean"
  | "settle"
  | "title"
  | "audio"
  | "scrub"
  | "export"
  | "done";

export type EditorScene = "logo" | "ui" | "end";

export interface EditorClip {
  name: string;
  /** Clip length on the timeline, in seconds. */
  seconds: number;
  /** Which built-in animated scene the clip shows in the monitor. */
  scene: EditorScene;
}

export const DEFAULT_CLIPS: EditorClip[] = [
  { name: "intro-logo.mp4", seconds: 3.5, scene: "logo" },
  { name: "dashboard.mov", seconds: 4, scene: "ui" },
  { name: "end-card.mp4", seconds: 3.5, scene: "end" },
];

export interface TimelineEditorTimingProps {
  clips?: EditorClip[];
}

const TITLE_AT = 130;
const AUDIO_AT = 138;
const SCRUB_AT = 156;
const SCRUB_END = 232;
const CLICK_AT = 258;
const DONE_AT = 312;

// `editor` springs the window in, fading it over `fade`; the pointer shows
// from `cursor`. `clip:<k>` drags clip `k`: the pointer reaches the bin by
// `reach`, presses at `press`, drops on V1 at `drop` (the clip flashes at
// `flash`) and rests at `rest` (a chain). `lean` pushes the camera in over
// its length; `settle` eases it back out by the scrub. `title` drops the
// title clip onto V2 (it flashes at `flash`); `audio` raises the audio clip
// onto A1 and draws its wave from `waveAt` to `waveEnd`. `scrub` shows the
// playhead handle from `show`, brings the pointer by `arrive`, starts the
// playhead at `grab` and drags it to its end; the pointer lets go `lift`
// after the end and leaves `leave` after it. `export` switches the camera
// at `camSwitch` and leans in from `camAt` to `camEnd`, brings the pointer
// by `arrive`, clicks Export, pops the panel at `pop`, moves the pointer
// away from `leave` to `away` and runs the progress through `progAt`,
// `prog1` and `prog2`. `done` finishes the progress `lead` before its start
// and turns the panel to done over its length.
export const timelineEditorTimeline = defineTimeline<
  TimelineEditorElementId,
  TimelineEditorTimingProps
>(({ clips = DEFAULT_CLIPS }) => {
  const n = clips.slice(0, 3).length;
  const lastDrop = n ? 6 + (n - 1) * 40 + 38 : 0;
  const elements: TimelineElement<TimelineEditorElementId>[] = [
    {
      id: "editor",
      lane: "Editor",
      label: "Window in",
      start: 0,
      length: 10,
      beats: { fade: 10, cursor: 4 },
    },
    { id: "lean", lane: "Camera", label: "Lean in", start: 12, length: 30 },
  ];
  for (let i = 0; i < n; i++) {
    const base = 6 + i * 40;
    elements.push({
      id: `clip:${i}`,
      lane: "Pointer",
      label: `Drag clip ${i + 1}`,
      start: base,
      length: 40,
      follows: i > 0 ? `clip:${i - 1}` : undefined,
      beats: { reach: 14, press: 18, drop: 38, flash: 40, rest: 42 },
    });
  }
  elements.push(
    {
      id: "settle",
      lane: "Camera",
      label: "Lean out",
      start: lastDrop + 6,
      length: SCRUB_AT + 4 - (lastDrop + 6),
      follows: n ? `clip:${n - 1}` : undefined,
    },
    {
      id: "title",
      lane: "Tracks",
      label: "Title clip",
      start: TITLE_AT,
      length: AUDIO_AT - TITLE_AT,
      follows: n ? `clip:${n - 1}` : undefined,
      beats: { flash: 3 },
    },
    {
      id: "audio",
      lane: "Tracks",
      label: "Audio clip",
      start: AUDIO_AT,
      length: SCRUB_AT - AUDIO_AT,
      follows: "title",
      beats: { waveAt: 2, waveEnd: 30 },
    },
    {
      id: "scrub",
      lane: "Pointer",
      label: "Scrub",
      start: SCRUB_AT,
      length: SCRUB_END - SCRUB_AT,
      follows: "audio",
      beats: { show: -6, arrive: -2, grab: 2, lift: 4, leave: 6 },
    },
    {
      id: "export",
      lane: "Pointer",
      label: "Export",
      start: CLICK_AT,
      length: DONE_AT - CLICK_AT,
      follows: "scrub",
      beats: {
        camSwitch: -30,
        camAt: -24,
        camEnd: 4,
        arrive: -4,
        pop: 2,
        leave: 10,
        away: 36,
        progAt: 8,
        prog1: 22,
        prog2: 34,
      },
    },
    {
      id: "done",
      lane: "Export",
      label: "Done",
      start: DONE_AT,
      length: 8,
      follows: "export",
      beats: { lead: -4 },
    },
  );
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
