import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The roadmap: the panel rises, the rows fade in and the bars grow, the
// dependency links draw, the milestone pops and the today line sweeps in,
// the camera eases in, then a cursor grabs a project, drags it later, the
// projects that depend on it shift after it and a toast confirms. Frames on
// the 30 fps scene timeline, after `delay` and `speed`. The ids are public:
// a saved `timing` prop refers to them.

export type RoadmapTimelineElementId =
  | "panel"
  | `row:${number}`
  | `bar:${number}`
  | `link:${number}`
  | "milestone"
  | "today"
  | "camera"
  | "cursor"
  | "grab"
  | "drag"
  | "drop"
  | "toast";

export type RoadmapStatus = "done" | "active" | "planned";

export interface RoadmapProject {
  name: string;
  /** Start date, e.g. "Aug 10". */
  start: string;
  /** Target date (inclusive), e.g. "Sep 18". */
  end: string;
  status: RoadmapStatus;
  /** 0–1, drawn as the darker part of the bar and as the status pie. */
  progress?: number;
  lead: string;
  color: string;
  /** Name of the project this one is blocked by. */
  dependsOn?: string;
}

export interface RoadmapTimelineTimingProps {
  projects?: RoadmapProject[];
  /** Frames the cursor takes to drag the project. */
  dragFrames?: number;
}

export const DEFAULT_PROJECTS: RoadmapProject[] = [
  {
    name: "Billing v2",
    start: "Jul 6",
    end: "Aug 7",
    status: "done",
    progress: 1,
    lead: "Maya Chen",
    color: "#3FA27B",
  },
  {
    name: "Public API",
    start: "Aug 10",
    end: "Sep 18",
    status: "active",
    progress: 0.4,
    lead: "Priya Raman",
    color: "#3B5BFD",
    dependsOn: "Billing v2",
  },
  {
    name: "Mobile app 1.0",
    start: "Sep 24",
    end: "Oct 29",
    status: "planned",
    progress: 0,
    lead: "Ana Souza",
    color: "#E5795B",
    dependsOn: "Public API",
  },
  {
    name: "Onboarding",
    start: "Jul 16",
    end: "Aug 28",
    status: "active",
    progress: 0.8,
    lead: "Leo Park",
    color: "#D9A33A",
  },
  {
    name: "Usage analytics",
    start: "Aug 19",
    end: "Oct 2",
    status: "active",
    progress: 0.25,
    lead: "Sam Ortiz",
    color: "#2A9FBF",
  },
  {
    name: "Docs site",
    start: "Oct 12",
    end: "Nov 13",
    status: "planned",
    progress: 0,
    lead: "Maya Chen",
    color: "#D55C9A",
  },
];

export const DRAG_FRAMES = 26;

/** Dependency links between projects, by index, in project order. */
export function linksOf(projects: RoadmapProject[]) {
  return projects
    .map((p, i) => {
      if (!p.dependsOn) return null;
      const b = projects.findIndex((q) => q.name === p.dependsOn);
      return b < 0 ? null : { from: b, to: i };
    })
    .filter((l): l is { from: number; to: number } => l !== null);
}

// Rows fade in `2` apart (the last row is the milestone's), bars grow `3`
// apart, links draw `5` apart with the arrowhead from `arrowAt`. The cursor
// travels in over its length; `grab` presses the bar, which hovers from
// `hoverAt`; `drag` slides it. `drop` is the release: the press lets go,
// the tooltip fades, the cursor moves away, the changed rows swap their
// dates and flash on its beats. The toast confirms.
export const roadmapTimelineTimeline = defineTimeline<
  RoadmapTimelineElementId,
  RoadmapTimelineTimingProps
>(
  ({
    projects = DEFAULT_PROJECTS,
    dragFrames = DRAG_FRAMES,
  }): TimelineElement<RoadmapTimelineElementId>[] => {
    const T = {
      rows: 8,
      bars: 12,
      links: 40,
      milestone: 50,
      sweep: 56,
      cursorIn: 76,
      grab: 99,
      dragStart: 102,
      dragEnd: 102 + dragFrames,
      toast: 110 + dragFrames,
    };
    const elements: TimelineElement<RoadmapTimelineElementId>[] = [
      { id: "panel", lane: "Panel", label: "panel", start: 0, length: 10 },
    ];
    for (let i = 0; i <= projects.length; i++) {
      elements.push({
        id: `row:${i}`,
        lane: "Rows",
        label: projects[i]?.name ?? "milestone",
        start: T.rows + i * 2,
        length: 10,
        follows: i > 0 ? `row:${i - 1}` : undefined,
      });
    }
    projects.forEach((p, i) => {
      elements.push({
        id: `bar:${i}`,
        lane: "Bars",
        label: p.name,
        start: T.bars + i * 3,
        length: 14,
        follows: i > 0 ? `bar:${i - 1}` : undefined,
      });
    });
    linksOf(projects).forEach((l, k) => {
      elements.push({
        id: `link:${k}`,
        lane: "Links",
        label: `${projects[l.from].name} → ${projects[l.to].name}`,
        start: T.links + k * 5,
        length: 12,
        follows: k > 0 ? `link:${k - 1}` : undefined,
        beats: { arrowAt: 9 },
      });
    });
    elements.push(
      {
        id: "milestone",
        lane: "Milestone",
        label: "milestone",
        start: T.milestone,
        length: 10,
        beats: { labelAt: 4 },
      },
      {
        id: "today",
        lane: "Today",
        label: "today line",
        start: T.sweep,
        length: 20,
        beats: { fadeAt: -2, fadeEnd: 3 },
      },
      {
        id: "camera",
        lane: "Camera",
        label: "ease in",
        start: 66,
        length: 32,
      },
      {
        id: "cursor",
        lane: "Cursor",
        label: "cursor in",
        start: T.cursorIn,
        length: T.grab - 4 - T.cursorIn,
        beats: { fadeIn: 6 },
      },
      {
        id: "grab",
        lane: "Cursor",
        label: "grab",
        start: T.grab,
        length: T.dragStart - T.grab,
        follows: "cursor",
        beats: { arriveAt: -4, hoverAt: -6, hoverEnd: -1 },
      },
      {
        id: "drag",
        lane: "Cursor",
        label: "drag",
        start: T.dragStart,
        length: dragFrames,
        follows: "grab",
      },
      {
        id: "drop",
        lane: "Cursor",
        label: "release",
        start: T.dragEnd,
        length: 26,
        follows: "drag",
        beats: {
          releaseAt: 1,
          releaseEnd: 5,
          tipOutAt: 2,
          tipOutEnd: 6,
          awayAt: 4,
          awayStart: 6,
          awayEnd: 26,
          swapAt: 2,
          swapEnd: 8,
          flashAt: 2,
          flashLag: 3,
          movedAt: 5,
          hoverOutAt: 8,
          hoverOutEnd: 14,
        },
      },
      {
        id: "toast",
        lane: "Toast",
        label: "toast",
        start: T.toast,
        length: 10,
        follows: "drop",
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
