import type { ReactNode } from "react";
import { LandingButton } from "@/app/(home)/components/landing/ui/landing-button";
import { BLOCK_SPACING } from "@/components/docs/blocks/spacing";
import { CopyButton } from "@/components/docs/copy-button";
import { cn } from "@/lib/utils";
import { getEntry, loadDocsSource } from "../data";

/** Numbered quick-start steps joined by a rail. */
export function QuickStart({ children }: { children: ReactNode }) {
  return (
    <ol
      data-not-typeset
      className={cn("not-prose flex flex-col pt-1 md:pt-1.5", BLOCK_SPACING)}
    >
      {children}
    </ol>
  );
}

/**
 * One quick-start step: title, a short note (MDX children) and the command to
 * run, with a copy button. Multi-line commands are separated by "\n".
 */
export function Step({
  n,
  title,
  command,
  children,
}: {
  n: number;
  title: string;
  command: string;
  children?: ReactNode;
}) {
  const lines = command.split("\n");
  return (
    <li className="group/step flex gap-3 md:gap-4">
      <span className="flex w-8 shrink-0 flex-col items-center gap-1.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-foreground text-small leading-4 font-medium text-inverse">
          {n}
        </span>
        <span className="w-0.5 grow rounded-[1px] bg-secondary group-last/step:hidden" />
      </span>
      <div className="flex min-w-0 grow flex-col gap-3 pb-7">
        <div className="flex flex-col gap-0.5 pt-[5px]">
          <h3 className="text-ui leading-[22px] font-medium text-foreground">
            {title}
          </h3>
          {children && (
            <div className="text-small leading-[22px] text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:decoration-divider [&_a]:underline-offset-4 [&_code]:font-mono [&_code]:text-[0.92em] [&_p]:m-0">
              {children}
            </div>
          )}
        </div>
        <div className="flex min-h-[52px] items-center gap-3 rounded-control border border-hairline bg-surface py-2 pr-2 pl-4">
          <pre className="min-w-0 grow overflow-x-auto font-mono text-small leading-6 text-foreground [scrollbar-width:none] max-md:[mask-image:linear-gradient(90deg,#000_80%,transparent)]">
            {lines.map((line) => (
              <span key={line} className="block whitespace-pre">
                {line.startsWith("/") ? line : `$ ${line}`}
              </span>
            ))}
          </pre>
          <CopyButton
            value={command}
            variant="ink"
            className="md:bg-secondary md:text-foreground md:hover:bg-[#dcdde0] md:dark:hover:bg-[#33363b]"
          />
        </div>
      </div>
    </li>
  );
}

/** Closing card pointing at the full Installation page. */
export async function InstallationLink({ children }: { children: ReactNode }) {
  await loadDocsSource();
  const page = getEntry("/docs/getting-started/installation");
  if (!page) return null;
  return (
    <div
      data-not-typeset
      className={cn(
        "not-prose flex flex-col items-start gap-4 rounded-card bg-surface-muted p-4 md:flex-row md:items-center md:justify-between md:gap-6 md:py-4 md:pr-4 md:pl-5",
        BLOCK_SPACING,
      )}
    >
      <div className="max-w-[520px] text-small leading-[22px] text-body [&_p]:m-0">
        {children}
      </div>
      <LandingButton
        href={page.url}
        variant="secondary"
        arrow={<span className="text-foreground">→</span>}
        className="h-10 rounded-control-sm px-4 text-small"
      >
        {page.title}
      </LandingButton>
    </div>
  );
}
