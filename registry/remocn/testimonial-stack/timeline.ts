import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Quote cards land on the pile one after another, each lighting up its key
// phrase, then the pile settles (or fans out into a wall under a title).
// Frames on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type TestimonialStackElementId = `quote:${number}` | "finale";

export interface TestimonialStackQuote {
  text: string;
  highlight?: string;
  name: string;
  role: string;
  handle?: string;
  avatarColor?: string;
  stars?: number;
  date?: string;
  source?: "x" | "none";
}

export interface TestimonialStackTimingProps {
  quotes?: TestimonialStackQuote[];
  ending?: "pile" | "fan";
  framesPerQuote?: number;
}

export const DEFAULT_QUOTES: TestimonialStackQuote[] = [
  {
    text: "We shipped our launch video in a single afternoon. The motion looks like a design team spent weeks on it.",
    highlight: "looks like a design team spent weeks on it",
    name: "Maya Chen",
    role: "Founder, Kitebase",
    handle: "@mayachen",
    date: "Oct 14",
    source: "x",
  },
  {
    text: "Dropped three components into our Remotion project and the demo basically built itself. Owning the code is the right call.",
    highlight: "the demo basically built itself",
    name: "Leo Park",
    role: "Staff Engineer, Lumen",
    handle: "@leopark",
    date: "Oct 15",
    source: "x",
  },
  {
    text: "Our launch clip got 3.4× the replies of anything we posted this year. The best tool we added this quarter.",
    highlight: "3.4× the replies",
    name: "Priya Raman",
    role: "Head of Growth, Fernway",
    stars: 5,
    date: "Oct 16",
    source: "none",
  },
  {
    text: "I’m not a motion designer and it doesn’t matter anymore. Every scene is production-ready out of the box.",
    highlight: "production-ready out of the box",
    name: "Daniel Okafor",
    role: "Indie hacker",
    handle: "@danokafor",
    date: "Oct 18",
    source: "x",
  },
];

// A quote runs until the next one lands. Its card spring starts at `start`;
// the next card covers it from `coverAt` to `cover`, and its highlight lights
// from `litAt` to `lit`. The finale starts the fan (cards `stagger` apart,
// each morphing over `morph`, the title from `titleAt` to `title`); in both
// endings the camera push ends `push` frames after it.
export const testimonialStackTimeline = defineTimeline<
  TestimonialStackElementId,
  TestimonialStackTimingProps
>(({ quotes = DEFAULT_QUOTES, ending = "pile", framesPerQuote = 50 }) => {
  const n = quotes.length;
  const per = framesPerQuote;
  const startOf = (i: number) => (i === 0 ? -6 : 4 + i * per);
  const fanStart = startOf(n - 1) + per - 6;
  const elements: TimelineElement<TestimonialStackElementId>[] = quotes.map(
    (quote, i) => ({
      id: `quote:${i}`,
      lane: "Quotes",
      label: quote.name,
      start: startOf(i),
      length: Math.max(0, (i < n - 1 ? startOf(i + 1) : fanStart) - startOf(i)),
      follows: i > 0 ? `quote:${i - 1}` : undefined,
      beats: { coverAt: 4, cover: 16, litAt: 14, lit: 30 },
    }),
  );
  elements.push(
    ending === "fan"
      ? {
          id: "finale",
          lane: "Finale",
          label: "fan out",
          start: fanStart,
          length: 22 + (n - 1) * 3,
          follows: n > 0 ? `quote:${n - 1}` : undefined,
          beats: {
            stagger: 3,
            morph: 22,
            titleAt: 10,
            title: 24,
            push: 60,
          },
        }
      : {
          id: "finale",
          lane: "Finale",
          label: "settle",
          start: fanStart,
          length: 60,
          follows: n > 0 ? `quote:${n - 1}` : undefined,
          beats: { push: 60 },
        },
  );
  return elements;
});
