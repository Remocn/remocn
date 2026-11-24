import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The title rising in word by word, the card stack dropping in and fanning
// out, one card being picked, the caption rising in word by word, and the
// slow camera push under all of it. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type CardFanElementId =
  | "camera"
  | `title:${number}`
  | "drop"
  | "fan"
  | "pick"
  | `caption:${number}`;

export interface CardFanTimingProps {
  title?: string;
  caption?: string;
  stagger?: number;
}

export const DEFAULT_TITLE = "Your top formats";
export const DEFAULT_CAPTION = "Launch films are 41% of this month’s renders";

const TITLE = 0;
const TITLE_STAGGER = 3;
const TITLE_RISE = 14;
const DROP = 4;
/** The cards behind the front one show this long after the drop starts. */
const DROP_SHOW = 6;
const FAN = 18;
/** Frames between one card opening and the next, front card first. */
const FAN_STAGGER = 3;
const PICK = 60;
const CAPTION = 72;
const CAPTION_STAGGER = 2;
const CAPTION_RISE = 12;
const CAMERA = 132;

// `title:<i>` and `caption:<i>` are word `i` of each line, each a chain.
// `fan` opens the cards one `stagger` beat apart; the fan follows the drop
// and the pick follows the fan.
export const cardFanTimeline = defineTimeline<
  CardFanElementId,
  CardFanTimingProps
>(
  ({
    title = DEFAULT_TITLE,
    caption = DEFAULT_CAPTION,
    stagger = TITLE_STAGGER,
  }) => {
    const elements: TimelineElement<CardFanElementId>[] = [
      {
        id: "camera",
        lane: "Camera",
        label: "Push in",
        start: 0,
        length: CAMERA,
      },
    ];
    title.split(" ").forEach((word, i) => {
      elements.push({
        id: `title:${i}`,
        lane: "Title",
        label: word,
        start: TITLE + i * stagger,
        length: TITLE_RISE,
        follows: i > 0 ? `title:${i - 1}` : undefined,
      });
    });
    elements.push(
      {
        id: "drop",
        lane: "Cards",
        label: "Stack drops in",
        start: DROP,
        length: FAN - DROP,
        beats: { show: DROP_SHOW },
      },
      {
        id: "fan",
        lane: "Cards",
        label: "Fan out",
        start: FAN,
        length: PICK - FAN,
        follows: "drop",
        beats: { stagger: FAN_STAGGER },
      },
      {
        id: "pick",
        lane: "Cards",
        label: "Pick a card",
        start: PICK,
        length: CAPTION - PICK,
        follows: "fan",
      },
    );
    caption.split(" ").forEach((word, i) => {
      elements.push({
        id: `caption:${i}`,
        lane: "Caption",
        label: word,
        start: CAPTION + i * CAPTION_STAGGER,
        length: CAPTION_RISE,
        follows: i > 0 ? `caption:${i - 1}` : "pick",
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
