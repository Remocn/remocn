import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The field of ticking counters fading in under a camera settling from a
// tilt, the light sweeping across the number left to right as its counters
// lock and light up, the rest of the field dimming and its clock braking to
// a stop, then the band, logo, divider and label rising in under the number.
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type NumberMosaicElementId =
  | "enter"
  | "camera"
  | "light"
  | "dim"
  | "brake"
  | "band"
  | "logo"
  | "divider"
  | "label";

export interface NumberMosaicTimingProps {
  sweep?: number;
}

// `enter` fades the field in and `camera` settles it flat over its length.
// `light` lights the number's counters: a counter starts `sweep` frames later
// from the left edge to the right, plus up to `jitter`, lights over `lit`
// and locks its digit `lock` frames after it starts. `dim` dims the rest of
// the field and `brake` slows the field's clock to a stop between its start
// and end. `band` quiets the field behind the label; `logo`, `divider` and
// `label` rise in one after another.
export const numberMosaicTimeline = defineTimeline<
  NumberMosaicElementId,
  NumberMosaicTimingProps
>(({ sweep = 26 }) => {
  const rise = (
    id: NumberMosaicElementId,
    label: string,
    start: number,
    follows: NumberMosaicElementId,
  ): TimelineElement<NumberMosaicElementId> => ({
    id,
    lane: "Label",
    label,
    start,
    length: 24,
    follows,
  });
  const elements: TimelineElement<NumberMosaicElementId>[] = [
    { id: "enter", lane: "Camera", label: "Fade in", start: 0, length: 16 },
    { id: "camera", lane: "Camera", label: "Settle", start: 0, length: 112 },
    {
      id: "light",
      lane: "Number",
      label: "Light sweep",
      start: 22,
      length: sweep + 12 + 12,
      beats: { sweep, jitter: 12, lit: 12, lock: 4 },
    },
    {
      id: "dim",
      lane: "Field",
      label: "Dim",
      start: 26,
      length: 50,
      follows: "light",
    },
    { id: "brake", lane: "Field", label: "Clock brake", start: 44, length: 48 },
    {
      id: "band",
      lane: "Label",
      label: "Band",
      start: 74,
      length: 26,
      follows: "dim",
    },
    rise("logo", "Logo", 84, "band"),
    rise("divider", "Divider", 87, "logo"),
    rise("label", "Label", 90, "divider"),
  ];
  return elements;
});
