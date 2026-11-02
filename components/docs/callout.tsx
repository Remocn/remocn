import { InfoIcon, TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BLOCK_SPACING } from "./blocks/spacing";

/**
 * Muted aside with an icon tile. Inline code and links inside get the same
 * treatment as in prose, since callouts opt out of typeset.
 */
function Callout({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside
      className={cn(
        "not-prose flex items-start gap-3.5 rounded-cta bg-surface-muted py-3.5 pr-[18px] pl-3.5",
        BLOCK_SPACING,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface text-foreground">
        {icon}
      </span>
      <div
        className={cn(
          "min-w-0 flex-1 pt-[7px] text-small leading-[22px] text-body",
          "[&_p+p]:mt-2",
          "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-divider [&_a]:underline-offset-[3px] [&_a:hover]:decoration-foreground",
          "[&_code]:box-decoration-clone [&_code]:rounded-tag [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-px [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:text-foreground [&_code]:shadow-[0_0_0_1px_var(--color-hairline)]",
        )}
      >
        {title ? (
          <p className="mb-0.5 font-medium text-foreground">{title}</p>
        ) : null}
        {children}
      </div>
    </aside>
  );
}

export function Note({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <Callout
      icon={<InfoIcon className="size-[18px]" strokeWidth={1.8} />}
      title={title}
    >
      {children}
    </Callout>
  );
}

export function Warning({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <Callout
      icon={<TriangleAlertIcon className="size-[18px]" strokeWidth={1.8} />}
      title={title}
    >
      {children}
    </Callout>
  );
}
