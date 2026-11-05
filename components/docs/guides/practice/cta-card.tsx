import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GuideButton, guideCard } from "../guide-ui";
import { findLink, paragraphs, textOf } from "../mdx-children";

/**
 * White card that hands off to another guide: icon tile, a title line, a
 * quieter sub line and an ink button. Children: markdown paragraphs — the
 * title, the sub line, and a last paragraph holding only the link, which
 * becomes the button.
 */
export function GuideCtaCard({
  icon,
  children,
}: {
  /** Glyph for the 44px tile; defaults to a 9:16 + 1:1 frame pair. */
  icon?: ReactNode;
  children: ReactNode;
}) {
  const all = paragraphs(children);
  const link = findLink(children);
  const [title = [], sub = []] = all.filter((p) => !findLink(p));
  const href = typeof link?.props.href === "string" ? link.props.href : "#";
  const label = textOf(link?.props.children);

  return (
    <div
      className={cn(
        "not-prose mt-4 flex flex-col gap-4 rounded-card py-[18px] pr-[18px] pl-5 sm:flex-row sm:items-center sm:gap-[18px]",
        guideCard,
      )}
    >
      <div className="flex grow items-center gap-[18px]">
        <span className="flex size-11 shrink-0 items-center justify-center gap-[3px] rounded-control-sm bg-surface-muted text-foreground">
          {icon ?? <FormatsGlyph />}
        </span>
        <div className="flex min-w-0 grow flex-col gap-0.5">
          <p className="text-ui leading-[22px] font-medium text-foreground">
            {title}
          </p>
          {sub.length > 0 && (
            <p className="text-small text-muted-foreground">{sub}</p>
          )}
        </div>
      </div>
      <GuideButton
        href={href}
        variant="ink"
        size="md"
        className="h-11 w-full sm:h-10 sm:w-auto"
      >
        {label}
      </GuideButton>
    </div>
  );
}

/** A vertical and a square frame side by side. */
function FormatsGlyph() {
  return (
    <>
      <span className="h-4 w-[9px] rounded-[2px] border-[1.8px] border-current" />
      <span className="size-3.5 rounded-[2px] border-[1.8px] border-current" />
    </>
  );
}
