import { Fragment, type ReactNode } from "react";
import { BLOCK_SPACING } from "@/components/docs/blocks/spacing";
import { cn } from "@/lib/utils";
import { Glyph, type GlyphName } from "./glyph";

/** The shadcn workflow as three mono chips joined by arrows (a column on phones). */
export function FileFlow({ steps }: { steps: string[] }) {
  return (
    <div
      className={cn(
        "not-prose flex flex-col items-start gap-2 pt-0.5 md:flex-row md:items-center",
        BLOCK_SPACING,
      )}
    >
      {steps.map((step, index) => (
        <Fragment key={step}>
          {index > 0 && (
            <Glyph
              name="arrow"
              strokeWidth={2}
              className="size-4 rotate-90 text-subtle max-md:ml-2.5 md:rotate-0"
            />
          )}
          <code className="flex h-9 max-w-full shrink-0 items-center rounded-[10px] bg-secondary px-3 font-mono text-caption leading-4 whitespace-nowrap text-foreground">
            {step}
          </code>
        </Fragment>
      ))}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="absolute top-3 left-3 flex h-[26px] items-center rounded-tile bg-surface px-[9px] text-mono leading-4 text-muted-foreground">
      {children}
    </span>
  );
}

function ApiTag({ ok, children }: { ok?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "flex h-[30px] items-center gap-1.5 rounded-tile px-2.5 font-mono text-mono leading-4",
        ok
          ? "bg-foreground text-inverse"
          : "bg-secondary text-muted-foreground",
      )}
    >
      <Glyph
        name={ok ? "check" : "cross"}
        strokeWidth={ok ? 2.6 : 2.4}
        className={cn(
          "size-3",
          ok ? "text-primary-soft dark:text-primary" : "text-muted-foreground",
        )}
      />
      {children}
    </span>
  );
}

function RuntimeCard({
  visual,
  title,
  text,
  tags,
}: {
  visual: ReactNode;
  title: string;
  text: string;
  tags: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-card border border-hairline bg-surface p-1.5">
      <div className="relative h-[184px] shrink-0 overflow-hidden rounded-control bg-surface-muted">
        {visual}
      </div>
      <div className="flex flex-col gap-3 px-3.5 pt-3.5 pb-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-ui leading-[22px] font-medium text-foreground">
            {title}
          </h4>
          <p className="text-small leading-5 text-body">{text}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">{tags}</div>
      </div>
    </div>
  );
}

const button =
  "flex h-[34px] w-[84px] items-center justify-center rounded-[10px] bg-foreground text-caption leading-4 text-inverse";

/** Frames of the scripted button: blurred and faint before, crisp at the playhead. */
const FRAMES = [
  { at: "13%", style: "opacity-22 blur-[2px]" },
  { at: "50%", style: "opacity-60 blur-[0.8px]" },
  { at: "87%", style: "" },
];

/**
 * "What changes is the runtime": the same button in the browser (driven by a
 * click) and in the renderer (a pure function of the frame).
 */
export function RuntimeDiff() {
  return (
    <div
      data-not-typeset
      className={cn("not-prose flex flex-col gap-3 pt-2", BLOCK_SPACING)}
    >
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <h3 className="text-[18px] leading-6 font-medium tracking-[-0.01em] text-foreground">
          What changes is the runtime
        </h3>
        <p className="text-small leading-5 text-muted-foreground">
          Same button, two runtimes
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <RuntimeCard
          title="A shadcn button"
          text="Responds to a click."
          visual={
            <>
              <Pill>In the browser</Pill>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="relative flex h-10 items-center rounded-control-sm bg-foreground px-[18px] text-small leading-5 text-inverse">
                  Continue
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="absolute top-[28px] left-[68px] size-[22px] fill-surface stroke-foreground stroke-[1.6] [stroke-linejoin:round]"
                  >
                    <path d="M5 3.5 19 11l-6.2 1.6L10 19Z" />
                  </svg>
                </span>
              </span>
            </>
          }
          tags={
            <>
              <ApiTag>useState</ApiTag>
              <ApiTag>onClick</ApiTag>
              <ApiTag>transition</ApiTag>
            </>
          }
        />
        <RuntimeCard
          title="A Remocn button"
          text="Same pixels for the same frame, every time."
          visual={
            <>
              <Pill>In the renderer</Pill>
              <span className="absolute inset-x-3.5 top-[62px] h-[34px]">
                {FRAMES.map((frame) => (
                  <span
                    key={frame.at}
                    style={{ left: frame.at }}
                    className={cn(
                      "absolute -translate-x-1/2",
                      button,
                      frame.style,
                    )}
                  >
                    Continue
                  </span>
                ))}
              </span>
              <span className="absolute inset-x-3.5 top-[116px] h-6 rounded-tile bg-secondary">
                <span className="absolute inset-y-0 left-0 w-1/2 rounded-tile bg-[#d2d4d7] dark:bg-[#3a3d42]" />
                <span className="absolute top-1.5 left-[13%] h-3 w-1 rounded-[2px] bg-foreground" />
                <span className="absolute top-1.5 left-[87%] h-3 w-1 rounded-[2px] bg-muted-foreground" />
                <span className="absolute -top-[5px] left-1/2 h-[34px] w-2 -translate-x-1/2 rounded-[4px] bg-primary shadow-[0_0_0_3px_var(--color-surface-muted)]" />
              </span>
              <span className="absolute inset-x-3.5 top-[150px] text-mono leading-4">
                <span className="absolute left-[13%] -translate-x-1/2 text-muted-foreground">
                  0
                </span>
                <span className="absolute left-1/2 -translate-x-1/2 font-medium text-primary">
                  30
                </span>
                <span className="absolute left-[87%] -translate-x-1/2 text-muted-foreground">
                  60
                </span>
              </span>
            </>
          }
          tags={<ApiTag ok>useCurrentFrame()</ApiTag>}
        />
      </div>
    </div>
  );
}

/** A tinted note led by a glyph tile, e.g. the frame-timing reminder. */
export function IconNote({
  icon,
  children,
}: {
  icon: GlyphName;
  children: ReactNode;
}) {
  return (
    <div
      data-not-typeset
      className={cn(
        "not-prose flex items-center gap-3.5 rounded-cta bg-surface-muted py-3.5 pr-[18px] pl-3.5 text-small leading-[22px] text-body max-md:items-start md:mt-3",
        BLOCK_SPACING,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface text-foreground">
        <Glyph name={icon} />
      </span>
      <div className="[&_code]:font-mono [&_code]:text-[0.9em]">{children}</div>
    </div>
  );
}
