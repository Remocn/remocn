import Link from "next/link";
import type { ReactNode } from "react";
import { LandingButton } from "@/app/(home)/components/landing/ui/landing-button";
import { IndexSection } from "../index-section";

/**
 * "Two kinds of atom" header: the MDX heading + lead (children) with a link to
 * the full concepts page beside the heading. The cards follow in `AtomCards`.
 */
export function AtomsSection({
  concepts,
  children,
}: {
  concepts: string;
  children: ReactNode;
}) {
  return (
    <IndexSection heading={children} className="relative">
      <LandingButton
        href={concepts}
        variant="secondary"
        arrow="→"
        className="h-11 w-full rounded-[10px] px-3 text-small font-normal sm:absolute sm:top-0 sm:right-0 sm:h-8 sm:w-auto [&>span:last-child]:text-foreground"
      >
        Read concepts
      </LandingButton>
    </IndexSection>
  );
}

export function AtomCards({ children }: { children: ReactNode }) {
  return (
    <div data-not-typeset className="not-prose mt-5 grid gap-3 sm:grid-cols-2">
      {children}
    </div>
  );
}

export function AtomCard({
  title,
  meta,
  code,
  items,
  children,
}: {
  title: string;
  /** Short note on how timing reaches it, e.g. "Snap or smooth". */
  meta: string;
  /** One-line example of how it is driven. */
  code: string;
  /** remocn-ui component names of this shape. */
  items: string[];
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3.5 rounded-card border border-hairline bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[18px] leading-6 font-medium text-foreground">
          {title}
        </h3>
        <span className="text-caption leading-4 text-muted-foreground">
          {meta}
        </span>
      </div>
      <div className="text-small leading-[22px] text-body [&_code]:font-mono [&_code]:text-[0.9em] [&_p]:m-0">
        {children}
      </div>
      <code className="flex h-10 items-center overflow-x-auto rounded-control-sm bg-surface-muted px-3 font-mono text-caption leading-4 whitespace-nowrap text-foreground">
        {code}
      </code>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((name) => (
          <li key={name}>
            <Link
              href={`/docs/ui/components/${name}`}
              className="flex h-7 items-center rounded-tile bg-secondary px-2.5 text-small text-foreground outline-none transition-colors hover:bg-[#dcdde0] focus-visible:ring-3 focus-visible:ring-ring dark:hover:bg-[#33363b]"
            >
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
