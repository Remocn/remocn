import {
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";
import { GradientTitle, type Tone } from "./gradient-title";
import { LAUNCH_PIECES } from "./launch-pieces.generated";
import { type Beat, Clip, Reel, reelLength } from "./parts";
import {
  CATEGORY_LOOK,
  cutsFor,
  enabledCategories,
  type ReleaseDemoProps,
} from "./selection";

/**
 * Remocn 3 release film.
 *
 * Short lines of large gradient type (gradients.sh grounds inside the
 * letters) carry the story, one phrase per beat, each entering and leaving
 * through an RGB split. Every change of beat is a hard cut.
 *
 * The new pieces play per docs category, sped up, each for at least
 * `minShare` of its own motion. Which pieces play is a prop: switch them on
 * and off in Remotion Studio and the film's length follows.
 *
 * 30fps on a 1280x720 stage, the size registry pieces are drawn for.
 * Render with --scale=1.5 for 1080p.
 */

/** Title hold before each category's montage. */
const CATEGORY_TITLE = 30;
/** Film grain in the category titles (gradients.sh `grain`, 0 to 1). */
const CATEGORY_GRAIN = 0.5;
/** The category list flashed word by word before the montages start. */
const WORD_SWAP = 9;
/** Montage pieces render in their light theme to sit in the paper world. */
const PIECE_PROPS = { theme: "light" };

const SITE = 24;
// One shot per page.
const SITE_CLIPS: [src: string, sourceFrames: number][] = [
  ["glide-home.mp4", 300],
  ["macro-intro.mp4", 270],
  ["glide-install.mp4", 300],
  ["focus-catalog.mp4", 270],
  ["focus-showcases.mp4", 270],
  ["focus-changelog.mp4", 270],
  ["macro-design-audit.mp4", 270],
];

const PRESET = new Map(CATEGORY_LOOK.map((c) => [c.title, c.preset]));

function line(
  id: string,
  frames: number,
  text: string,
  preset: GshPresetId,
  options: {
    tone?: Tone;
    value?: number;
    push?: number;
    maxSize?: number;
    grain?: number;
  } = {},
): Beat {
  return {
    id,
    frames,
    node: <GradientTitle text={text} preset={preset} {...options} />,
  };
}

function draftBeats(props: ReleaseDemoProps): Beat[] {
  const categories = enabledCategories(props);
  return [
    // Reveal
    line("introducing", 30, "Introducing", "solar-wind", { tone: "dark" }),
    line("remocn-3", 96, "Remocn 3", "solar-wind", {
      tone: "dark",
      push: 0.08,
      maxSize: 260,
    }),

    // Redesign
    line("redesigned", 34, "Redesigned", "spectral-sea"),
    ...SITE_CLIPS.map(([src, sourceFrames]) => ({
      id: `site-${src}`,
      frames: SITE,
      node: <Clip src={src} sourceFrames={sourceFrames} frames={SITE} />,
    })),

    // Launch Pack
    line("count", 66, "new components", "solar-wind", {
      value: LAUNCH_PIECES.length,
    }),
    ...categories.map(({ title }) =>
      line(`swap-${title}`, WORD_SWAP, title, PRESET.get(title) ?? "comet"),
    ),
    line("one-release", 36, "One release", "petal-arc"),

    ...categories.flatMap((category) => [
      line(
        `title-${category.title}`,
        CATEGORY_TITLE,
        category.title,
        PRESET.get(category.title) ?? "comet",
        { grain: CATEGORY_GRAIN },
      ),
      ...cutsFor(category, props).map(
        (cut): Beat => ({
          id: `piece-${cut.piece.name}`,
          frames: cut.frames,
          piece: {
            component: cut.piece.component,
            props: PIECE_PROPS,
            cutIn: cut.cutIn,
            length: cut.piece.frames,
            speed: cut.speed,
          },
        }),
      ),
    ]),

    // Close
    line("own-every-frame", 40, "Own every frame", "comet"),
    line("end-remocn-3", 84, "Remocn 3", "solar-wind", {
      tone: "dark",
      push: 0.06,
      maxSize: 260,
    }),
    line("end-url", 60, "remocn.dev", "spectral-sea"),
  ];
}

/** The score. Its music ends here; the rest of the file is silence. */
const MUSIC = "audio/attitude.mp3";
const MUSIC_END_SECONDS = 159.6;
/** Beat grid of the score, measured from its kick: ~138.7 bpm. */
const BEAT_SECONDS = 0.4327;
const FIRST_BEAT_SECONDS = 0.1325;
const FPS = 30;

/** Beat and half-beat times of the looping score, in film frames. */
function beatGrid(totalFrames: number) {
  const beats: number[] = [];
  const halves: number[] = [];
  for (let loop = 0; loop * MUSIC_END_SECONDS * FPS < totalFrames; loop++) {
    const start = loop * MUSIC_END_SECONDS;
    for (
      let t = start + FIRST_BEAT_SECONDS;
      t < start + MUSIC_END_SECONDS;
      t += BEAT_SECONDS
    ) {
      beats.push(t * FPS);
      halves.push(t * FPS, (t + BEAT_SECONDS / 2) * FPS);
    }
  }
  return { beats, halves };
}

const nearest = (grid: number[], frame: number) =>
  grid.reduce((a, b) => (Math.abs(b - frame) < Math.abs(a - frame) ? b : a));

/**
 * Moves every cut onto the score: each beat's end goes to the nearest beat,
 * or the nearest half-beat for cuts shorter than a beat. A cut moves at most
 * half a beat, so the edit keeps its shape.
 */
function onTheBeat(beats: Beat[]): Beat[] {
  const total = reelLength(beats);
  const grid = beatGrid(total + 2 * BEAT_SECONDS * FPS);
  const beatFrames = BEAT_SECONDS * FPS;
  let draftEnd = 0;
  let snappedEnd = 0;
  return beats.map((beat) => {
    draftEnd += beat.frames;
    const target = nearest(
      beat.frames < beatFrames ? grid.halves : grid.beats,
      draftEnd,
    );
    const end = Math.max(snappedEnd + 2, Math.round(target));
    const frames = end - snappedEnd;
    snappedEnd = end;
    return { ...beat, frames };
  });
}

export function buildBeats(props: ReleaseDemoProps): Beat[] {
  return onTheBeat(draftBeats(props));
}

export const releaseDemoLength = (props: ReleaseDemoProps) =>
  reelLength(buildBeats(props));

/** Frames the score takes to fade out under the closing lines. */
const MUSIC_FADE_OUT = 150;

/**
 * Starts with the first frame and loops if the film outlasts the track,
 * skipping the track's silent tail. Fades down under the close.
 */
function Score() {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  // Fade on the film's clock, not the looping track's.
  const volume = interpolate(
    frame,
    [durationInFrames - MUSIC_FADE_OUT, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <Audio
      src={staticFile(MUSIC)}
      loop
      trimAfter={Math.round(MUSIC_END_SECONDS * fps)}
      volume={volume}
    />
  );
}

export function ReleaseDemo(props: ReleaseDemoProps) {
  return (
    <>
      <Reel beats={buildBeats(props)} />
      <Score />
    </>
  );
}
