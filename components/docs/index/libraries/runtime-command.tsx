import type { ReactNode } from "react";

/** A one-line prerequisite: a sentence followed by the command it asks for. */
export function RuntimeCommand({
  command,
  children,
}: {
  command: string;
  children: ReactNode;
}) {
  return (
    <div className="not-prose mt-4 flex flex-wrap items-center gap-2.5 pl-1 text-small text-muted-foreground [&_p]:m-0">
      {children}
      <code className="flex h-[30px] shrink-0 items-center rounded-tile bg-capsule px-2.5 font-mono text-mono leading-4 text-body">
        {command}
      </code>
    </div>
  );
}
