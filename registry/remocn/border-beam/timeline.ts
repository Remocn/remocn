import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The card springs up, a beam laps its border once, then the content blurs
// in line by line. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type BorderBeamElementId =
  | "card"
  | "beam"
  | "logo"
  | "title"
  | "description"
  | "command";

export interface BorderBeamTimingProps {
  title?: string;
  description?: string;
  command?: string;
  lap?: number;
}

export const DEFAULT_TITLE = "Version 2.0";
export const DEFAULT_DESCRIPTION =
  "Launch videos, written in React. Installed like shadcn.";
export const DEFAULT_COMMAND = "npx shadcn add @remocn/launch-film";
/** Frames for one lap of the beam at the default `lap`. */
export const LAP = 80;
/** The card's heavy spring settles in this many frames. */
const CARD = 21;
const CARD_FADE = 12;
const LAP_START = 14;
/** The beam's tail trails its head by this many frames. */
const LAG = 8;
const CONTENT_START = 84;
const STAGGER = 5;
const CONTENT = 18;

// `card` springs the card up and fades it in over `fade`. `beam` runs the
// head once round the border over its length, the tail `lag` behind.
// `logo`, `title`, `description` and `command` blur in, `STAGGER` apart;
// a chain.
export const borderBeamTimeline = defineTimeline<
  BorderBeamElementId,
  BorderBeamTimingProps
>(
  ({
    title = DEFAULT_TITLE,
    description = DEFAULT_DESCRIPTION,
    command = DEFAULT_COMMAND,
    lap = LAP,
  }) => {
    const content: [BorderBeamElementId, string][] = [
      ["logo", "Logo"],
      ["title", title],
      ["description", description],
      ["command", command],
    ];
    const elements: TimelineElement<BorderBeamElementId>[] = [
      {
        id: "card",
        lane: "Card",
        label: "Card",
        start: 0,
        length: CARD,
        beats: { fade: CARD_FADE },
      },
      {
        id: "beam",
        lane: "Beam",
        label: "Beam lap",
        start: LAP_START,
        length: lap,
        beats: { lag: LAG },
      },
      ...content.map(
        ([id, label], i): TimelineElement<BorderBeamElementId> => ({
          id,
          lane: "Content",
          label,
          start: CONTENT_START + i * STAGGER,
          length: CONTENT,
          follows: i > 0 ? content[i - 1][0] : undefined,
        }),
      ),
    ];
    return elements;
  },
);
