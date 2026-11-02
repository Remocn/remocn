import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GuideCopyButton } from "../guide-copy-button";
import { guideCard, guidePanel } from "../guide-ui";
import { textOf } from "../mdx-children";
import { TIDEPOOL, TidepoolMark } from "./brand-frames";

type Field = {
  label: string;
  value: string;
  swatch?: string;
  tile?: ReactNode;
};

const FIELDS: Field[] = [
  {
    label: "Product",
    value: `${TIDEPOOL.name} — a calm inbox for support teams`,
  },
  {
    label: "Background, light",
    value: TIDEPOOL.background,
    swatch: TIDEPOOL.background,
  },
  {
    label: "Text color",
    value: TIDEPOOL.text,
    swatch: TIDEPOOL.text,
  },
  {
    label: "Accent color, used sparingly",
    value: TIDEPOOL.accent,
    swatch: TIDEPOOL.accent,
  },
  {
    label: "Font mood",
    value: "Clean and geometric",
    tile: (
      <span className="text-[15px] leading-[18px] font-semibold tracking-title">
        Aa
      </span>
    ),
  },
  {
    label: "Logo",
    value: "tidepool.svg",
    tile: <TidepoolMark size={18} />,
  },
  { label: "Copy tone", value: "Plain and confident, no exclamation marks" },
];

/**
 * The brand brief: a filled-in example next to the prompt that saves it.
 * Children: the prompt (a `GuidePrompt` around the fence).
 */
export function GuideBrandBrief({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose mt-4 flex flex-col gap-4 sm:flex-row sm:items-stretch [&>figure]:mt-0 [&>figure]:min-w-0 sm:[&>figure]:grow sm:[&>figure]:basis-0">
      <section
        aria-label="A filled-in brand brief, for example"
        className={cn(
          "flex shrink-0 flex-col rounded-card p-1.5 sm:w-[296px]",
          guideCard,
        )}
      >
        <header className="flex h-11 shrink-0 items-center justify-between pr-3 pl-3.5">
          <span className="text-small font-medium text-foreground">
            Filled in, for example
          </span>
          <span className="flex h-6 items-center rounded-tile bg-surface-muted px-2 font-mono text-mono text-body">
            BRAND.md
          </span>
        </header>
        <ul className="flex grow flex-col gap-0.5 rounded-control bg-surface-muted p-1.5">
          {FIELDS.map((field) => (
            <li
              key={field.label}
              className="flex items-center gap-3 rounded-tile bg-surface px-3 py-2.5"
            >
              {(field.swatch || field.tile) && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-tile text-foreground",
                    field.swatch
                      ? "shadow-[inset_0_0_0_1px_var(--color-divider)]"
                      : "bg-surface-muted",
                  )}
                  style={
                    field.swatch ? { backgroundColor: field.swatch } : undefined
                  }
                >
                  {field.tile}
                </span>
              )}
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-caption text-muted-foreground">
                  {field.label}
                </span>
                <span className="text-small text-foreground">
                  {field.value}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      {children}
    </div>
  );
}

/**
 * "From then on…" line with the one sentence to start every prompt with.
 * Children: one markdown paragraph whose bold part is the sentence.
 */
export function GuideBrandLine({ children }: { children: ReactNode }) {
  const full = textOf(children);
  const line = full.match(/"([^"]+)"/)?.[1] ?? "";
  const lead = full.replace(/\s*"[^"]+"\.?\s*$/, "");

  return (
    <div
      className={cn(
        "not-prose mt-4 flex flex-col gap-3 rounded-card p-2 sm:flex-row sm:items-center sm:gap-[18px] sm:pl-5",
        guideCard,
      )}
    >
      <p className="grow px-2 pt-2 text-[15px] leading-[22px] text-body sm:p-0">
        {lead}
      </p>
      <span
        className={cn(
          "flex h-12 shrink-0 items-center justify-between gap-3 rounded-control-sm pr-1.5 pl-[18px]",
          guidePanel,
        )}
      >
        <code className="font-mono text-caption leading-[18px] text-[#e4e5e7]">
          {line}
        </code>
        <GuideCopyButton value={line} className="h-9 rounded-tag" />
      </span>
    </div>
  );
}
