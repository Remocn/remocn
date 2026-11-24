import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Signups landing on a world map: the panel opens, the map's dots fade in
// west to east, the counter, its delta and the country rows rise in, then
// each signup lands (an arc from the one before, a ring, a name chip, a row
// in the feed) under a slow camera drift. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type WorldSignupsElementId =
  | "panel"
  | "map"
  | "counter"
  | "camera"
  | `country:${number}`
  | "delta"
  | `signup:${number}`;

/** A signup as the schedule reads it: `at` is the frame it lands on. */
export interface SignupTiming {
  name: string;
  city: string;
  country: string;
  lon: number;
  lat: number;
  plan?: "Free" | "Pro" | "Team";
  at: number;
}

export interface WorldSignupsTimingProps {
  signups?: { name: string; at: number }[];
  countries?: { name: string }[];
}

export const DEFAULT_SIGNUPS: SignupTiming[] = [
  {
    name: "Maya Chen",
    city: "Lisbon",
    country: "PT",
    lon: -9.14,
    lat: 38.72,
    plan: "Pro",
    at: 26,
  },
  {
    name: "Kenji Sato",
    city: "Tokyo",
    country: "JP",
    lon: 139.69,
    lat: 35.69,
    plan: "Free",
    at: 38,
  },
  {
    name: "Ana Souza",
    city: "São Paulo",
    country: "BR",
    lon: -46.63,
    lat: -23.55,
    plan: "Pro",
    at: 49,
  },
  {
    name: "Leo Park",
    city: "Seoul",
    country: "KR",
    lon: 126.98,
    lat: 37.57,
    plan: "Team",
    at: 59,
  },
  {
    name: "Priya Raman",
    city: "Bengaluru",
    country: "IN",
    lon: 77.59,
    lat: 12.97,
    plan: "Free",
    at: 68,
  },
  {
    name: "Jonas Weber",
    city: "Berlin",
    country: "DE",
    lon: 13.4,
    lat: 52.52,
    plan: "Pro",
    at: 77,
  },
  {
    name: "Sam Ortiz",
    city: "Austin",
    country: "US",
    lon: -97.74,
    lat: 30.27,
    plan: "Free",
    at: 85,
  },
  {
    name: "Amara Okafor",
    city: "Lagos",
    country: "NG",
    lon: 3.38,
    lat: 6.52,
    plan: "Free",
    at: 93,
  },
  {
    name: "Chloé Martin",
    city: "Paris",
    country: "FR",
    lon: 2.35,
    lat: 48.86,
    plan: "Pro",
    at: 101,
  },
  {
    name: "Noah Williams",
    city: "Sydney",
    country: "AU",
    lon: 151.21,
    lat: -33.87,
    plan: "Team",
    at: 108,
  },
  {
    name: "Olivia Brown",
    city: "Toronto",
    country: "CA",
    lon: -79.38,
    lat: 43.65,
    plan: "Free",
    at: 115,
  },
  {
    name: "Elena Rossi",
    city: "Milan",
    country: "IT",
    lon: 9.19,
    lat: 45.46,
    plan: "Pro",
    at: 122,
  },
  {
    name: "Diego Ramírez",
    city: "Mexico City",
    country: "MX",
    lon: -99.13,
    lat: 19.43,
    plan: "Free",
    at: 129,
  },
  {
    name: "Aiko Tanaka",
    city: "Osaka",
    country: "JP",
    lon: 135.5,
    lat: 34.69,
    plan: "Pro",
    at: 137,
  },
  {
    name: "Tom Becker",
    city: "Seattle",
    country: "US",
    lon: -122.33,
    lat: 47.61,
    plan: "Team",
    at: 145,
  },
];

export const DEFAULT_COUNTRIES: {
  name: string;
  code: string;
  count: number;
}[] = [
  { name: "United States", code: "US", count: 2184 },
  { name: "Germany", code: "DE", count: 1032 },
  { name: "Brazil", code: "BR", count: 902 },
  { name: "India", code: "IN", count: 871 },
  { name: "Japan", code: "JP", count: 655 },
];

/** Columns of the dot map; the reveal sweeps them west to east. */
const MAP_COLUMNS = 120;

export const worldSignupsTimeline = defineTimeline<
  WorldSignupsElementId,
  WorldSignupsTimingProps
>(({ signups = DEFAULT_SIGNUPS, countries = DEFAULT_COUNTRIES }) => {
  // The signups land in time order; each one is placed by its own `at`.
  const events = signups
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s.at - b.s.at);
  const lastAt = events.length ? events[events.length - 1].s.at : 120;
  const elements: TimelineElement<WorldSignupsElementId>[] = [
    { id: "panel", lane: "Panel", label: "dashboard", start: 0, length: 10 },
    {
      id: "map",
      lane: "Map",
      label: "map dots",
      start: 4,
      length: 10 + (MAP_COLUMNS - 1) * 0.12,
      // A dot fades over `dot`; each column starts `column` after the last.
      beats: { dot: 10, column: 0.12 },
    },
    {
      id: "counter",
      lane: "Counter",
      label: "counter",
      start: 4,
      length: 14,
    },
    {
      id: "camera",
      lane: "Camera",
      label: "camera drift",
      start: 10,
      length: lastAt + 30 - 10,
    },
  ];
  countries.forEach((c, i) => {
    elements.push({
      id: `country:${i}`,
      lane: "Countries",
      label: c.name,
      start: 10 + i * 3,
      length: 12,
      follows: i > 0 ? `country:${i - 1}` : undefined,
    });
  });
  elements.push({
    id: "delta",
    lane: "Counter",
    label: "delta",
    start: 12,
    length: 10,
  });
  events.forEach(({ s, i }, k) => {
    const prev = events[k - 1];
    const next = events[k + 1];
    elements.push({
      id: `signup:${i}`,
      lane: "Signups",
      label: s.name,
      start: s.at,
      length: (next?.s.at ?? s.at + 40) - s.at,
      follows: prev ? `signup:${prev.i}` : undefined,
      beats: {
        // The arc from the previous city: its head runs from `arcHead` to the
        // landing, its tail from `arcTail` to `arcTailEnd`.
        arcHead: -12,
        arcTail: -3,
        arcTailEnd: 12,
        heat: 18,
        ring: 24,
        bump: 24,
        // The name chip and the feed row come in a frame after the landing.
        chip: 1,
        chipOut: 6,
        row: 1,
        rowIn: 10,
        glow: 6,
        glowEnd: 30,
      },
    });
  });
  return elements.sort((a, b) => a.start - b.start);
});
