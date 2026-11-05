import type { ReactNode } from "react";

/** White card with the 6% hairline, shared by every traffic panel. */
export const CARD = "rounded-card border border-hairline bg-card";

/** Muted card title with a mono hint on the right ("sessions"). */
export function CardHeader({
  title,
  hint,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className={className ?? "text-small text-muted-foreground"}>
        {title}
      </h3>
      {hint && <span className="text-caption text-subtle">{hint}</span>}
    </div>
  );
}
