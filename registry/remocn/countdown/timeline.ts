import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The countdown: the halo fading in, each numeral holding for a beat and
// handing over to the next through a ring wipe or a slice, the last one
// rushing past the camera, then the final label hitting with its caption.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type CountdownElementId =
  | "halo"
  | `number:${number}`
  | "final"
  | "caption";

export interface CountdownTimingProps {
  from?: number;
  beat?: number;
}

// `halo` fades the halo in; it breathes in until the final hit. `number:<k>`
// holds numeral `count - k` over its length; the numerals form a chain. Each
// enters and exits a few fixed frames around its own start and end. `final`
// follows the last numeral: the label fades in over `fade` and sharpens over
// `blur`, the dot springs in at `dotAt`, the stage kicks up to `kickPeak` and
// settles by `kick`, the light pushes from `pushAt` through `pushPeak` to
// `push`, and the halo opens from `haloAt` to `halo`. `caption` follows the
// final hit.
export const countdownTimeline = defineTimeline<
  CountdownElementId,
  CountdownTimingProps
>(({ from = 3, beat = 20 }): TimelineElement<CountdownElementId>[] => {
  const count = Math.max(1, Math.round(from));
  const final = count * beat;
  const elements: TimelineElement<CountdownElementId>[] = [
    { id: "halo", lane: "Halo", label: "fade in", start: 0, length: 14 },
  ];
  for (let k = 0; k < count; k++) {
    elements.push({
      id: `number:${k}`,
      lane: "Numbers",
      label: String(count - k),
      start: k * beat,
      length: beat,
      follows: k > 0 ? `number:${k - 1}` : undefined,
      beats: { enter: 9 },
    });
  }
  elements.push(
    {
      id: "final",
      lane: "Final",
      label: "final",
      start: final,
      length: 30,
      follows: `number:${count - 1}`,
      beats: {
        fade: 6,
        blur: 8,
        dotAt: 4,
        kickPeak: 3,
        kick: 24,
        pushAt: -2,
        pushPeak: 2,
        push: 26,
        haloAt: -4,
        halo: 30,
      },
    },
    {
      id: "caption",
      lane: "Final",
      label: "caption",
      start: final + 12,
      length: 20,
      follows: "final",
    },
  );
  return elements;
});
