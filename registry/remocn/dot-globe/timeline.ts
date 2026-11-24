import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The dotted globe materialises and the camera settles, the copy rises in
// line by line, then arcs fly city to city one after another, each landing
// ticking the counter up. Frames on the 30 fps scene timeline, after `delay`
// and `speed`. The ids are public: a saved `timing` prop refers to them.

export type DotGlobeElementId =
  | "globe"
  | "prefix"
  | "count"
  | "suffix"
  | `route:${number}`;

export interface GlobeCity {
  name: string;
  lat: number;
  lon: number;
}

export interface GlobeRoute {
  from: GlobeCity;
  to: GlobeCity;
}

export interface DotGlobeTimingProps {
  routes?: GlobeRoute[];
  /** Frames between one route taking off and the next. */
  stagger?: number;
  /** Frames each arc takes to fly from city to city. */
  flight?: number;
}

const C = {
  london: { name: "London", lat: 51.5, lon: -0.13 },
  lagos: { name: "Lagos", lat: 6.52, lon: 3.38 },
  berlin: { name: "Berlin", lat: 52.52, lon: 13.4 },
  nairobi: { name: "Nairobi", lat: -1.29, lon: 36.82 },
  lisbon: { name: "Lisbon", lat: 38.72, lon: -9.14 },
  newYork: { name: "New York", lat: 40.71, lon: -74.0 },
  saoPaulo: { name: "São Paulo", lat: -23.55, lon: -46.63 },
  madrid: { name: "Madrid", lat: 40.42, lon: -3.7 },
  mexico: { name: "Mexico City", lat: 19.43, lon: -99.13 },
  dakar: { name: "Dakar", lat: 14.7, lon: -17.44 },
  bogota: { name: "Bogotá", lat: 4.71, lon: -74.07 },
  toronto: { name: "Toronto", lat: 43.65, lon: -79.38 },
  cairo: { name: "Cairo", lat: 30.04, lon: 31.24 },
} satisfies Record<string, GlobeCity>;

export const DEFAULT_ROUTES: GlobeRoute[] = [
  { from: C.london, to: C.lagos },
  { from: C.berlin, to: C.cairo },
  { from: C.lisbon, to: C.newYork },
  { from: C.madrid, to: C.saoPaulo },
  { from: C.london, to: C.toronto },
  { from: C.dakar, to: C.bogota },
  { from: C.newYork, to: C.mexico },
];

const ROUTE_START = 18;
const ROUTE_GAP = 20;
const FLIGHT = 32;
/** Frames between one line of copy rising and the next. */
const COPY_STAGGER = 3;

// `globe` runs as long as the camera settles; its tilt keeps easing over the
// `tilt` beat. A route runs from take-off to landing: its tail chases the
// head past the landing, and the landing's ring, pin, label and counter tick
// are beats counted from the landing.
export const dotGlobeTimeline = defineTimeline<
  DotGlobeElementId,
  DotGlobeTimingProps
>(
  ({
    routes = DEFAULT_ROUTES,
    stagger = ROUTE_GAP,
    flight = FLIGHT,
  }): TimelineElement<DotGlobeElementId>[] => {
    const elements: TimelineElement<DotGlobeElementId>[] = [
      {
        id: "globe",
        lane: "Globe",
        label: "globe",
        start: 0,
        length: 60,
        beats: {
          tilt: 210,
          air: 40,
          body: 16,
          rimAt: 4,
          rim: 30,
          dots: 18,
          dot: 12,
        },
      },
    ];
    const copy = ["prefix", "count", "suffix"] as const;
    copy.forEach((id, k) => {
      elements.push({
        id,
        lane: "Copy",
        label: id,
        start: 6 + k * COPY_STAGGER,
        length: 28,
        follows: k > 0 ? copy[k - 1] : undefined,
      });
    });
    routes.forEach((route, i) => {
      elements.push({
        id: `route:${i}`,
        lane: "Routes",
        label: `${route.from.name} → ${route.to.name}`,
        start: ROUTE_START + i * stagger,
        length: flight,
        follows: i > 0 ? `route:${i - 1}` : undefined,
        beats: {
          origin: 4,
          tailAt: flight * 0.55,
          tailEnd: flight + 26,
          ring: 30,
          echo: 7,
          pin: 8,
          labelAt: 2,
          labelIn: 12,
          labelOutAt: 44,
          labelOut: 58,
          tick: 12,
        },
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
