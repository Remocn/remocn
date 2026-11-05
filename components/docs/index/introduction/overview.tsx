import type { ReactNode } from "react";
import { BLOCK_SPACING } from "@/components/docs/blocks/spacing";
import { CodeBlockCommand } from "@/components/docs/code-block-command";
import { convertNpmCommand } from "@/lib/convert-npm-command";
import { cn } from "@/lib/utils";
import { Glyph, type GlyphName } from "./glyph";

/** The three "what remocn is" pillars, one bordered strip (stacked on phones). */
export function Pillars({ children }: { children: ReactNode }) {
  return (
    <div
      data-not-typeset
      className={cn(
        "not-prose flex flex-col rounded-card border border-hairline bg-surface md:flex-row",
        BLOCK_SPACING,
      )}
    >
      {children}
    </div>
  );
}

export function Pillar({
  icon,
  title,
  path,
  children,
}: {
  icon: GlyphName;
  title: string;
  /** Optional mono path chip under the copy. */
  path?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex basis-0 gap-3.5 p-[18px] not-first:border-t not-first:border-hairline md:grow md:flex-col md:px-[22px] md:pt-[22px] md:pb-6 md:not-first:border-t-0 md:not-first:border-l">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-muted text-foreground">
        <Glyph name={icon} />
      </span>
      <div className="flex min-w-0 grow flex-col gap-1 md:gap-1.5">
        <h3 className="text-ui leading-[22px] font-medium text-foreground">
          {title}
        </h3>
        <div className="text-small leading-[22px] text-body [&_a]:underline [&_a]:decoration-divider [&_a]:underline-offset-4 [&_code]:font-mono [&_code]:text-[0.92em]">
          {children}
        </div>
        {path && (
          <code className="mt-1.5 flex h-7 w-fit items-center rounded-tile bg-surface-muted px-2.5 font-mono text-mono leading-4 text-foreground md:mt-1 md:h-[26px] md:px-[9px]">
            {path}
          </code>
        )}
      </div>
    </div>
  );
}

/** "Add your first component": the shared install card, retitled. */
export function FirstComponent({ name }: { name: string }) {
  return (
    <div className={cn("not-prose", BLOCK_SPACING)}>
      <CodeBlockCommand
        title="Add your first component"
        component={name}
        prompt={`Add the @remocn/${name} component to my project.`}
        {...convertNpmCommand(`npx shadcn@latest add @remocn/${name}`)}
      />
    </div>
  );
}

/** A muted one-line aside led by a small glyph. */
export function Aside({
  icon = "search",
  children,
}: {
  icon?: GlyphName;
  children: ReactNode;
}) {
  return (
    <div
      data-not-typeset
      className={cn(
        "not-prose flex items-start gap-2.5 px-1 py-0.5 text-small leading-5 text-muted-foreground",
        BLOCK_SPACING,
        "md:mt-3.5",
        icon === "info" && "text-caption leading-5",
      )}
    >
      <Glyph
        name={icon}
        strokeWidth={icon === "info" ? 1.9 : 1.8}
        className={cn(
          "mt-0.5 size-4",
          icon === "info" ? "text-subtle" : "text-muted-foreground",
        )}
      />
      <div className="[&_a]:text-foreground [&_a]:underline [&_a]:decoration-divider [&_a]:underline-offset-4">
        {children}
      </div>
    </div>
  );
}
