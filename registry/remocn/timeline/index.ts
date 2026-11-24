import { useMemo } from "react";

// A component's schedule, kept apart from its drawing: which elements the
// animation has (an entry, a word, a finale), when each starts and how long
// it runs. The schedule is a pure function of the props, so it can be read
// without rendering anything, and a `timing` prop can move, trim or stretch
// single elements without touching the code that draws them.
//
//   // timeline.ts, next to the component
//   export const titleTimeline = defineTimeline<TitleElementId, TitleProps>(
//     ({ words = WORDS }, { length }) =>
//       words.map((word, k) => ({
//         id: `word:${k}`,
//         lane: "Words",
//         label: word,
//         start: k * 8,
//         length: 8,
//         follows: k > 0 ? `word:${k - 1}` : undefined,
//         beats: { rise: 12 },
//       })),
//   );
//
//   // index.tsx
//   const tl = useTimeline(titleTimeline, props, length, timing);
//   const word = tl.get("word:0");
//   interpolate(t, [word.start, word.start + word.beat("rise")], [0, 1]);
//
// Every number is in frames of the 30 fps scene timeline, after `delay` and
// `speed`: those still apply to the whole animation, `timing` works inside it.
// Element ids are public API: a saved `timing` refers to them, so an id once
// shipped keeps its meaning.

/** One timed part of an animation, as its schedule lays it out. */
export interface TimelineElement<Id extends string = string> {
  /** Stable name a `timing` override refers to: `entry:0`, `finale`. */
  id: Id;
  /** Row the element sits on in a timeline view. */
  lane: string;
  /** What the element shows, for people reading the timeline. */
  label: string;
  /** First frame of the element. */
  start: number;
  /** Frames until the next element of the lane takes over, or the end. */
  length: number;
  /**
   * The element this one comes after. When that element's end moves, this
   * one moves with it, keeping the gap between them.
   */
  follows?: Id;
  /**
   * Named frame counts inside the element, measured from its start: how long
   * a roll takes, when a second part begins. `stretch` scales them.
   */
  beats?: Record<string, number>;
}

/** A change to one element, made from outside the component. */
export interface TimingOverride {
  /** New first frame. Wins over the shift from `follows`. */
  start?: number;
  /** New length, trimming or extending the element. Wins over `stretch`. */
  length?: number;
  /** Multiplies the length and every beat: 2 plays the element half as fast. */
  stretch?: number;
  /** Stops following: the element keeps its own start when the one before moves. */
  detach?: boolean;
}

/** Overrides by element id: the `timing` prop of a component. */
export type Timing<Id extends string = string> = Partial<
  Record<Id, TimingOverride>
>;

/** A component's schedule: props and the scene length in, elements out. */
export type Schedule<Id extends string, Props> = (
  props: Props,
  scene: { length: number },
) => TimelineElement<Id>[];

/** An element after `timing` has been applied. */
export interface ResolvedElement<Id extends string = string>
  extends TimelineElement<Id> {
  /** `start + length`. */
  end: number;
  beats: Record<string, number>;
  /** A beat by name, stretched. Throws on a name the schedule didn't set. */
  beat(name: string): number;
  /**
   * 0 → 1 over the element, or over its first `beat` frames when a beat is
   * named. Clamped on both sides.
   */
  progress(frame: number, beat?: string): number;
}

export interface ResolvedTimeline<Id extends string = string> {
  /** All elements, in the order the schedule returned them. */
  elements: ResolvedElement<Id>[];
  /** An element by id. Throws on an id the schedule didn't return. */
  get(id: Id): ResolvedElement<Id>;
  /** The elements of one lane, in order. */
  lane(name: string): ResolvedElement<Id>[];
}

/** Declares a schedule. Elements come back in time order. */
export function defineTimeline<Id extends string, Props>(
  schedule: Schedule<Id, Props>,
): Schedule<Id, Props> {
  return schedule;
}

/** Applies `timing` to a schedule's elements and carries the `follows` chains. */
export function resolve<Id extends string>(
  elements: TimelineElement<Id>[],
  timing: Timing<Id> = {},
): ResolvedTimeline<Id> {
  const byId = new Map<Id, TimelineElement<Id>>(elements.map((e) => [e.id, e]));
  const done = new Map<Id, ResolvedElement<Id>>();
  const visiting = new Set<Id>();

  const place = (element: TimelineElement<Id>): ResolvedElement<Id> => {
    const known = done.get(element.id);
    if (known) return known;
    if (visiting.has(element.id)) {
      throw new Error(`timeline: "${element.id}" follows itself`);
    }
    visiting.add(element.id);

    const override: TimingOverride = timing[element.id] ?? {};
    const stretch = override.stretch ?? 1;
    const beats: Record<string, number> = {};
    for (const [name, frames] of Object.entries(element.beats ?? {})) {
      beats[name] = frames * stretch;
    }

    let start = element.start;
    const leader = element.follows ? byId.get(element.follows) : undefined;
    if (leader && !override.detach) {
      // The leader's end moved by this much; this element moves as far.
      start += place(leader).end - (leader.start + leader.length);
    }
    if (override.start !== undefined) start = override.start;
    const length = override.length ?? element.length * stretch;

    const beat = (name: string) => {
      const frames = beats[name];
      if (frames === undefined) {
        throw new Error(`timeline: "${element.id}" has no beat "${name}"`);
      }
      return frames;
    };
    const resolved: ResolvedElement<Id> = {
      ...element,
      start,
      length,
      end: start + length,
      beats,
      beat,
      progress: (frame, name) => {
        const span = name === undefined ? length : beat(name);
        if (span <= 0) return frame >= start ? 1 : 0;
        return Math.min(1, Math.max(0, (frame - start) / span));
      },
    };
    visiting.delete(element.id);
    done.set(element.id, resolved);
    return resolved;
  };

  const all = elements.map(place);
  return {
    elements: all,
    get: (id) => {
      const element = done.get(id);
      if (!element) throw new Error(`timeline: no element "${id}"`);
      return element;
    },
    lane: (name) => all.filter((e) => e.lane === name),
  };
}

/**
 * The component side: runs the schedule and applies `timing`, once per
 * change of its inputs. `length` is the scene length the schedule fits into,
 * in the same frames the component counts.
 */
export function useTimeline<Id extends string, Props>(
  schedule: Schedule<Id, Props>,
  props: Props,
  length: number,
  timing?: Timing<Id>,
): ResolvedTimeline<Id> {
  return useMemo(
    () => resolve(schedule(props, { length }), timing),
    [schedule, props, length, timing],
  );
}
