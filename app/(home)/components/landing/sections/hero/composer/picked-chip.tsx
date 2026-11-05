import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RemocnMark } from "../../../ui/remocn-mark";
import type { ChipTile, PickedBlock } from "./scenarios";

const TILE =
  "relative flex size-[26px] shrink-0 items-center justify-center overflow-hidden rounded-tile";
const LIGHT_TILE = `${TILE} bg-white text-[#0E1012] shadow-[0_0_0_1px_#0E101214]`;
const DARK_TILE = `${TILE} bg-[#0E1012]`;
const STILL = "motion-reduce:animate-none";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Tile({ tile }: { tile: ChipTile }) {
  switch (tile.kind) {
    case "drift":
      return (
        <span data-tile className={TILE}>
          <span
            className={cn(
              "absolute top-0 left-0 h-[121.875%] w-[260%] animate-tile-drift bg-[length:100%_100%]",
              STILL,
            )}
            style={{ backgroundImage: `url(${tile.src})` }}
          />
        </span>
      );
    case "gradient":
      return (
        <span data-tile className={TILE}>
          <span
            className={cn(
              "absolute inset-y-0 left-0 w-[200%] animate-tile-pan",
              STILL,
            )}
            style={{ backgroundImage: tile.background }}
          />
        </span>
      );
    case "blur-in":
      return (
        <span data-tile className={LIGHT_TILE}>
          <span
            className={cn(
              "animate-tile-blur-in text-mono font-bold tracking-[-0.04em]",
              STILL,
            )}
          >
            Aa
          </span>
        </span>
      );
    case "typewriter":
      return (
        <span data-tile className={cn(LIGHT_TILE, "gap-px")}>
          <span
            className={cn(
              "animate-tile-type text-mono font-bold tracking-[-0.04em]",
              STILL,
            )}
          >
            Aa
          </span>
          <span className="h-3 w-[1.5px] animate-[caret-blink_1.06s_steps(1)_infinite] rounded-full bg-primary motion-reduce:hidden" />
        </span>
      );
    case "zoom":
      return (
        <span data-tile className={cn(TILE, "bg-[#E4E4E7]")}>
          <span
            className={cn(
              "absolute inset-[5px] animate-tile-zoom rounded-[3px]",
              STILL,
            )}
            style={{ backgroundColor: tile.color }}
          />
        </span>
      );
    case "whip":
      return (
        <span data-tile className={cn(TILE, "justify-start")}>
          <span
            className={cn(
              "flex h-full w-[300%] shrink-0 animate-tile-whip",
              STILL,
            )}
          >
            <span
              className="h-full flex-1"
              style={{ backgroundColor: tile.color }}
            />
            <span className="h-full flex-1 bg-[#E4E4E7]" />
            <span
              className="h-full flex-1"
              style={{ backgroundColor: tile.color }}
            />
          </span>
        </span>
      );
    case "glitch": {
      const split = `linear-gradient(90deg, ${tile.color} 55%, #0E1012 55%)`;
      return (
        <span data-tile className={TILE} style={{ background: split }}>
          <span
            className={cn(
              "absolute inset-x-0 top-0 h-[9px] animate-tile-glitch",
              STILL,
            )}
            style={{ background: split }}
          />
          <span
            className={cn(
              "absolute inset-x-0 bottom-0 h-[8px] animate-tile-glitch [animation-delay:-0.12s] [animation-direction:reverse]",
              STILL,
            )}
            style={{ background: split }}
          />
        </span>
      );
    }
    case "caption":
      return (
        <span data-tile className={cn(DARK_TILE, "gap-[3px]")}>
          {["", "[animation-delay:-1.2s]"].map((delay) => (
            <span
              key={delay}
              className="h-1.5 w-[7px] overflow-hidden rounded-[2px]"
            >
              <span
                className={cn(
                  "block h-full w-[200%] animate-tile-karaoke bg-[linear-gradient(90deg,#F0ABFC_50%,#4A4E52_50%)]",
                  delay,
                  STILL,
                )}
              />
            </span>
          ))}
        </span>
      );
    case "terminal":
      return (
        <span data-tile className={cn(DARK_TILE, "gap-[2px] text-[#86EFAC]")}>
          <svg viewBox="0 0 24 24" className="size-3 shrink-0">
            <path d="m7 7 5 5-5 5" {...stroke} strokeWidth={2.8} />
          </svg>
          <span
            className={cn(
              "h-[2px] w-[8px] origin-left animate-tile-line rounded-full bg-[#86EFAC]",
              STILL,
            )}
          />
        </span>
      );
    case "chart":
      return (
        <span
          data-tile
          className={cn(LIGHT_TILE, "items-end gap-[2px] pb-[6px]")}
        >
          {[
            "h-1.5 bg-[#C026D3]",
            "h-2.5 bg-[#C026D3] [animation-delay:0.12s]",
            "h-3.5 bg-[#A800B7] [animation-delay:0.24s]",
          ].map((bar) => (
            <span
              key={bar}
              className={cn(
                "w-[3px] origin-bottom animate-tile-grow rounded-[1px]",
                bar,
                STILL,
              )}
            />
          ))}
        </span>
      );
    case "check":
      return (
        <span data-tile className={cn(LIGHT_TILE, "text-[#22C55E]")}>
          <svg viewBox="0 0 24 24" className="size-4">
            <path
              d="M20 6 9 17l-5-5"
              pathLength={1}
              strokeDasharray={1}
              className={cn("animate-tile-draw", STILL)}
              {...stroke}
            />
          </svg>
        </span>
      );
    case "cursor":
      return (
        <span data-tile className={LIGHT_TILE}>
          <svg
            viewBox="0 0 24 24"
            className={cn("size-3.5 animate-tile-cursor", STILL)}
          >
            <path
              d="M5 3l14 7.5-6.2 1.8L10 19z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );
    case "number":
      return (
        <span data-tile className={cn(DARK_TILE, "items-start")}>
          <span
            className={cn(
              "flex animate-tile-roll flex-col text-[11px] text-white tabular-nums",
              STILL,
            )}
          >
            {["42", "43", "44", "42"].map((value, i) => (
              <span
                key={`${value}-${i}`}
                className="flex h-[26px] items-center"
              >
                {value}
              </span>
            ))}
          </span>
        </span>
      );
    case "logo":
      return (
        <span data-tile className={cn(DARK_TILE, "text-white")}>
          <RemocnMark className={cn("h-3 w-[11px] animate-tile-pop", STILL)} />
        </span>
      );
    case "scanlines":
      return (
        <span data-tile className={cn(TILE, "animate-tile-flicker", STILL)}>
          <span
            className={cn(
              "absolute inset-x-0 -top-1 h-[calc(100%+4px)] animate-tile-scanline bg-[repeating-linear-gradient(0deg,#0E1012_0_2px,#1F3D2A_2px_4px)]",
              STILL,
            )}
          />
        </span>
      );
  }
}

/**
 * The pill shell: a link to the active block's docs page. Children stack in a
 * single grid cell (see PickedSlot), and the clip keeps the rolling content
 * inside the pill.
 */
export function PickedPill({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid overflow-clip rounded-control-sm bg-surface-muted py-[5px] pr-3 pl-[5px] outline-none transition-colors duration-150 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}

/** Tile + docs title of one picked block. */
export function PickedContent({
  block,
  sizer = false,
  className,
}: {
  block: PickedBlock;
  sizer?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "col-start-1 row-start-1 flex items-center gap-2",
        className,
      )}
    >
      {sizer ? (
        <span className="size-[26px] shrink-0" />
      ) : (
        <Tile tile={block.tile} />
      )}
      <span className="text-[13px] leading-4 whitespace-nowrap text-foreground">
        {block.title}
      </span>
    </span>
  );
}
