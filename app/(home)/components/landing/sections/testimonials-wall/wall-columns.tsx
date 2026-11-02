import { getXPost } from "@/config/x-posts";
import { cn } from "@/lib/utils";
import { XPostCard } from "./x-post-card";

/** Handles per column, top to bottom, as laid out in the design. */
const COLUMNS: string[][] = [
  ["shadcn", "bhoomikacodes", "yesadok", "haydenbleasel"],
  ["JNYBGR", "dingyi", "denicmarko", "milessy_bc"],
  ["orcdev", "davidhaz", "guillaume_rygn", "bzagrodzki"],
];

const COLUMN_REVEAL = ["", "[--reveal-i:1]", "[--reveal-i:2]"];

const COLUMN_MOTION = [
  "[--marquee-duration:62s]",
  "[--marquee-duration:74s] [animation-direction:reverse]",
  "[--marquee-duration:56s]",
];

function ColumnCopy({
  handles,
  hidden,
}: {
  handles: string[];
  hidden?: boolean;
}) {
  return (
    // The loop's second copy stays hoverable: `inert` would also drop pointer
    // events, and the reversed column shows mostly this copy. It leaves the
    // tab order and the a11y tree instead.
    <ul aria-hidden={hidden || undefined} className="flex flex-col gap-4 pb-4">
      {handles.map((handle) => (
        <li key={handle} className="flex flex-col">
          <XPostCard
            post={getXPost(handle)}
            tabIndex={hidden ? -1 : undefined}
          />
        </li>
      ))}
    </ul>
  );
}

export function WallColumns() {
  return (
    <div className="group/wall relative flex h-[760px] w-full items-start gap-4 overflow-clip mask-[linear-gradient(to_bottom,transparent,#000_10%,#000_78%,transparent)]">
      {COLUMNS.map((handles, column) => (
        <div
          key={handles[0]}
          data-reveal
          className={cn("min-w-0 flex-1", COLUMN_REVEAL[column])}
        >
          <div
            className={cn(
              "flex animate-marquee-y flex-col group-hover/wall:[animation-play-state:paused] group-focus-within/wall:[animation-play-state:paused] motion-reduce:animate-none",
              COLUMN_MOTION[column],
            )}
          >
            <ColumnCopy handles={handles} />
            <ColumnCopy handles={handles} hidden />
          </div>
        </div>
      ))}
    </div>
  );
}
