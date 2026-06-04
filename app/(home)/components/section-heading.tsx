import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FadeUp } from "./fade-up";

/**
 * Canonical section header used across the landing page so the type
 * hierarchy stays consistent everywhere:
 *   eyebrow (xs, muted, mono)  →  title (h2)  →  lead (body, muted)
 * An optional `action` slot sits inline on the right at desktop widths.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  action,
  align = "start",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  align?: "start" | "center";
  className?: string;
}) {
  const centered = align === "center";

  return (
    <FadeUp>
      <div
        className={cn(
          "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
          className,
        )}
      >
        <div
          className={cn(
            "max-w-2xl",
            centered && "mx-auto text-center sm:items-center",
          )}
        >
          {eyebrow && (
            <p className="mb-3 font-mono text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
          )}
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
            {title}
          </h2>
          {lead && (
            <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
              {lead}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </FadeUp>
  );
}
