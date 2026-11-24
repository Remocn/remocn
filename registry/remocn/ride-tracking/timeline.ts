import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A ride on its way: the phone rises with the trip sheet, the route draws
// and the pickup pin drops, the camera zooms in and follows the car along
// the route while the ETA counts down, then the car arrives and the sheet
// turns to "arrived". Three copy lines beside the phone carry the route, the
// drive and the arrival. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type RideTrackingElementId =
  | "phone"
  | "camera"
  | `line:${number}`
  | "sheet"
  | "route"
  | "drive"
  | "arrive";

export interface RideTrackingTimingProps {
  /** Frames the car takes to drive the route to the pickup. */
  drive?: number;
}

const DRAW_AT = 14;
const DRAW_END = 42;
const DRIVE_AT = 52;
const DRIVE_END = 214;
export const DEFAULT_DRIVE = DRIVE_END - DRIVE_AT;

// `phone` rises the phone in on a spring; `camera` pushes in over its
// length. `line:<i>` is copy line i beside the phone, rising in over `in`;
// a line leaves from `out` to `outEnd` around the next one's start. `sheet`
// slides the trip sheet up, its driver row rising at `driver`, the caption
// beside the phone at `caption` and the action row at `actions`. `route`
// draws the route over its length; the pickup pin drops at `pin`, where the
// camera starts zooming in. `drive` drives the car along the route over its
// length, the ETA counting down on the way; the zoom lands at `zoomEnd`.
// `arrive` settles the camera over its length, turns the sheet to arrived
// and starts the pin's pulses.
export const rideTrackingTimeline = defineTimeline<
  RideTrackingElementId,
  RideTrackingTimingProps
>(({ drive = DEFAULT_DRIVE }) => {
  const driveEnd = DRIVE_AT + drive;
  const line = { in: 14, out: -2, outEnd: 6 };
  const elements: TimelineElement<RideTrackingElementId>[] = [
    { id: "phone", lane: "Phone", label: "Phone", start: 0, length: 30 },
    { id: "camera", lane: "Camera", label: "Push", start: 0, length: 270 },
    {
      id: "line:0",
      lane: "Copy",
      label: "Route line",
      start: 0 + 8,
      length: DRIVE_AT - 4 - 8,
      beats: line,
    },
    {
      id: "sheet",
      lane: "Phone",
      label: "Trip sheet",
      start: 10,
      length: 20,
      beats: { driver: 8, caption: 10, actions: 12 },
    },
    {
      id: "route",
      lane: "Map",
      label: "Route",
      start: DRAW_AT,
      length: DRAW_END - DRAW_AT,
      beats: { pin: DRAW_END - 6 - DRAW_AT },
    },
    {
      id: "line:1",
      lane: "Copy",
      label: "Drive line",
      start: DRIVE_AT - 4,
      length: driveEnd - (DRIVE_AT - 4),
      follows: "route",
      beats: line,
    },
    {
      id: "drive",
      lane: "Map",
      label: "Drive",
      start: DRIVE_AT,
      length: drive,
      follows: "route",
      beats: { zoomEnd: 30 },
    },
    {
      id: "arrive",
      lane: "Map",
      label: "Arrive",
      start: driveEnd,
      length: 30,
      follows: "drive",
    },
    {
      id: "line:2",
      lane: "Copy",
      label: "Arrival line",
      start: driveEnd,
      length: 30,
      follows: "drive",
      beats: line,
    },
  ];
  return elements
    .map((e, k) => ({ e, k }))
    .sort((a, b) => a.e.start - b.e.start || a.k - b.k)
    .map(({ e }) => e);
});
