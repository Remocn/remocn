import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The land's dots fading in west to east, the count and its label rising in,
// then the cities lighting up across the map in a sweep (each with a pop and
// a ripple) as the count climbs, under a slow push. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type DotMapElementId =
  | "push"
  | "map"
  | "count"
  | "label"
  | `city:${number}`;

export interface DotMapTimingProps {
  cities?: { lon: number; lat: number }[];
  sweep?: number;
}

export const DEFAULT_CITIES: { lon: number; lat: number }[] = [
  { lon: -122.4, lat: 37.8 },
  { lon: -118.2, lat: 34.1 },
  { lon: -123.1, lat: 49.3 },
  { lon: -104.9, lat: 39.7 },
  { lon: -99.1, lat: 19.4 },
  { lon: -87.6, lat: 41.9 },
  { lon: -79.4, lat: 43.7 },
  { lon: -74, lat: 40.7 },
  { lon: -84.4, lat: 33.7 },
  { lon: -74.1, lat: 4.7 },
  { lon: -77, lat: -12 },
  { lon: -70.7, lat: -33.4 },
  { lon: -58.4, lat: -34.6 },
  { lon: -46.6, lat: -23.5 },
  { lon: -43.2, lat: -22.9 },
  { lon: -21.9, lat: 64.1 },
  { lon: -9.1, lat: 38.7 },
  { lon: -3.7, lat: 40.4 },
  { lon: -0.1, lat: 51.5 },
  { lon: -6.3, lat: 53.3 },
  { lon: 2.4, lat: 48.9 },
  { lon: 4.9, lat: 52.4 },
  { lon: -7.6, lat: 33.6 },
  { lon: 3.4, lat: 6.5 },
  { lon: 13.4, lat: 52.5 },
  { lon: 12.5, lat: 41.9 },
  { lon: 18.1, lat: 59.3 },
  { lon: 21, lat: 52.2 },
  { lon: 18.4, lat: -33.9 },
  { lon: 28, lat: -26.2 },
  { lon: 31.2, lat: 30 },
  { lon: 29, lat: 41 },
  { lon: 36.8, lat: -1.3 },
  { lon: 30.5, lat: 50.5 },
  { lon: 46.7, lat: 24.7 },
  { lon: 55.3, lat: 25.2 },
  { lon: 72.9, lat: 19.1 },
  { lon: 77.2, lat: 28.6 },
  { lon: 77.6, lat: 13 },
  { lon: 90.4, lat: 23.8 },
  { lon: 100.5, lat: 13.8 },
  { lon: 103.8, lat: 1.4 },
  { lon: 106.8, lat: -6.2 },
  { lon: 106.7, lat: 10.8 },
  { lon: 114.2, lat: 22.3 },
  { lon: 121.5, lat: 31.2 },
  { lon: 116.4, lat: 39.9 },
  { lon: 121, lat: 14.6 },
  { lon: 127, lat: 37.6 },
  { lon: 139.7, lat: 35.7 },
  { lon: 135.5, lat: 34.7 },
  { lon: 115.9, lat: -31.9 },
  { lon: 151.2, lat: -33.9 },
  { lon: 145, lat: -37.8 },
  { lon: 174.8, lat: -36.8 },
];

const MAP_IN = -6;
const MAP_DUR = 26;
const LIGHT_AT = 20;
const LIGHT_SPAN = 66;
const RIPPLE = 26;

export function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// `push` scales the scene up over its length. `map` fades the land in: a
// dot's fade starts `spread` frames later from the west edge to the east, plus
// up to `jitter`, and runs `fade` frames. `count` and `label` rise in under
// the map. `city:<i>` lights city `i` (its index in `cities`) at its start,
// popping over `pop` and rippling out over its length; the cities run west to
// east and form a chain in that order.
export const dotMapTimeline = defineTimeline<
  DotMapElementId,
  DotMapTimingProps
>(({ cities = DEFAULT_CITIES, sweep = LIGHT_SPAN }) => {
  const done = LIGHT_AT + sweep + 6;
  const lights = cities
    .map((city, i) => {
      const x = (city.lon + 180) / 360;
      return { i, at: LIGHT_AT + x * sweep + (hash(i + 0.7) - 0.5) * 8 };
    })
    .sort((a, b) => a.at - b.at);
  const elements: TimelineElement<DotMapElementId>[] = [
    {
      id: "map",
      lane: "Map",
      label: "Land",
      start: MAP_IN,
      length: 16 + 6 + (MAP_DUR - 16),
      beats: { spread: 16, jitter: 6, fade: MAP_DUR - 16 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "Push in",
      start: 0,
      length: done + 40,
    },
    {
      id: "count",
      lane: "Count",
      label: "Count",
      start: LIGHT_AT - 8,
      length: 16,
    },
    {
      id: "label",
      lane: "Count",
      label: "Label",
      start: LIGHT_AT,
      length: 16,
      follows: "count",
    },
  ];
  lights.forEach((l, k) => {
    elements.push({
      id: `city:${l.i}`,
      lane: "Cities",
      label: `City ${l.i + 1}`,
      start: l.at,
      length: RIPPLE,
      follows: k > 0 ? `city:${lights[k - 1].i}` : undefined,
      beats: { pop: 10 },
    });
  });
  return elements.sort((a, b) => a.start - b.start);
});
