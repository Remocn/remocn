import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The roll of credits rising in, the name sliding up beside it, each step of
// the roll onto the next role, and the roles gathering into a stack. Frames
// on the 30 fps scene timeline, after `delay` and `speed`. The ids are
// public: a saved `timing` prop refers to them.

export type CrewOfOneElementId = "intro" | "name" | `roll:${number}` | "gather";

export interface CrewOfOneTimingProps {
  roles?: string[];
}

export const DEFAULT_ROLES = [
  "Written by",
  "Directed by",
  "Edited by",
  "Motion by",
  "Captions by",
  "Shipped by",
];

/** The roles drawn: the list, or one placeholder when it is empty. */
export const rolesOf = (roles: string[]) =>
  roles.length > 0 ? roles : ["Made by"];

const INTRO_END = 18;
const NAME_AT = 8;
const NAME_END = 26;
const ROLL_START = 30;
const GATHER_GAP = 12;
const GATHER = 24;

// `length` is the clip length without `speed`: the roll stretches to 60% of
// it. Each step of the roll follows the one before; the gather follows the
// last step.
export const crewOfOneTimeline = defineTimeline<
  CrewOfOneElementId,
  CrewOfOneTimingProps
>(({ roles = DEFAULT_ROLES }, { length }) => {
  const n = rolesOf(roles).length;
  const D = Math.max(90, length);
  const rollEnd = Math.max(ROLL_START + (n - 1) * 10, D * 0.6);
  const step = n > 1 ? (rollEnd - ROLL_START) / (n - 1) : 1;
  const move = Math.min(13, step * 0.55);
  const cStart = rollEnd + GATHER_GAP;
  const elements: TimelineElement<CrewOfOneElementId>[] = [
    {
      id: "intro",
      lane: "Roll",
      label: "roll in",
      start: 0,
      length: INTRO_END,
    },
    {
      id: "name",
      lane: "Name",
      label: "name",
      start: NAME_AT,
      length: NAME_END - NAME_AT,
    },
  ];
  for (let k = 1; k < n; k++) {
    elements.push({
      id: `roll:${k}`,
      lane: "Roll",
      label: rolesOf(roles)[k],
      start: ROLL_START + (k - 1) * step + (step - move),
      length: move,
      follows: k > 1 ? `roll:${k - 1}` : undefined,
    });
  }
  elements.push({
    id: "gather",
    lane: "Roll",
    label: "stack",
    start: cStart,
    length: GATHER,
    follows: n > 1 ? `roll:${n - 1}` : undefined,
  });
  return elements;
});
