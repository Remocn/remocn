import type { ReactNode } from "react";

/** The three numbered "how it works" cards above the template list. */
export function TemplateSteps({ children }: { children: ReactNode }) {
  return (
    <ol data-not-typeset className="not-prose mt-2 grid gap-2 sm:grid-cols-3">
      {children}
    </ol>
  );
}

export function TemplateStep({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-cta border border-hairline bg-surface p-4">
      <span className="text-caption leading-4 whitespace-pre text-muted-foreground">
        {n}
        {"  "}
        {title}
      </span>
      <span className="text-small text-foreground [&_code]:font-mono [&_code]:text-[0.9em] [&_p]:m-0">
        {children}
      </span>
    </li>
  );
}
