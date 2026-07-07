import Link from "next/link";
import { CodeBlockCommand } from "@/components/docs/code-block-command";
import {
  ADD,
  INIT,
  RENDER,
  SAMPLE_COMPONENTS,
  START,
  type Step,
} from "@/lib/config/snippets";
import { convertNpmCommand } from "@/lib/convert-npm-command";
import { cn } from "@/lib/utils";
import { FadeUp } from "../fade-up";
import { SectionHeading } from "../section-heading";
import { Tok, TypewriterCodeBlock } from "../typewriter-code-block";

function StepBadge({ n, accent }: { n: number; accent: string }) {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-medium text-foreground tabular-nums"
      style={{
        backgroundColor: `color-mix(in oklab, ${accent} 16%, transparent)`,
        borderColor: `color-mix(in oklab, ${accent} 45%, transparent)`,
      }}
    >
      {n}
    </span>
  );
}

function CompactStep({
  step,
  delay,
  className,
}: {
  step: Step;
  delay: number;
  className?: string;
}) {
  return (
    <FadeUp delay={delay} className={cn("min-w-0", className)}>
      <div className="surface-card flex min-w-0 flex-col gap-4 rounded-2xl p-5 sm:p-4">
        <div className="flex items-center gap-3">
          <StepBadge n={step.n} accent={step.accent} />
          <h3 className="text-base font-semibold tracking-tight text-foreground">
            {step.title}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {step.description}
        </p>
        <CodeBlockCommand
          component={step.component}
          variant="outline"
          {...convertNpmCommand(step.command)}
        />
      </div>
    </FadeUp>
  );
}

function FeaturedStep({
  step,
  delay,
  className,
}: {
  step: Step;
  delay: number;
  className?: string;
}) {
  return (
    <FadeUp delay={delay} className={cn("min-w-0", className)}>
      <div className="surface-card flex min-w-0 flex-col gap-5 rounded-2xl p-6 sm:rounded-3xl sm:p-6">
        <div className="flex items-center gap-3">
          <StepBadge n={step.n} accent={step.accent} />
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {step.title}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {step.description}
        </p>

        <CodeBlockCommand
          component={step.component}
          variant="outline"
          {...convertNpmCommand(step.command)}
        />

        <TypewriterCodeBlock
          header={false}
          text={<Tok kind="string">"Hello, world"</Tok>}
          fontSize={<Tok kind="number">72</Tok>}
          color={<Tok kind="string">"#171717"</Tok>}
          fontWeight={<Tok kind="number">700</Tok>}
          cursor={<Tok kind="boolean">true</Tok>}
        />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {SAMPLE_COMPONENTS.map((name) => (
            <span
              key={name}
              className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
            >
              {name}
            </span>
          ))}
          <Link
            href="/docs/components"
            className="rounded-lg px-2.5 py-1 text-xs text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
          >
            + more
          </Link>
        </div>
      </div>
    </FadeUp>
  );
}

export function GetStarted() {
  return (
    <section id="get-started" className="relative py-20 sm:py-20">
      <div className="section">
        <SectionHeading
          eyebrow="Get started"
          title="Ship your first frame in minutes"
          lead="If you know shadcn/ui, you already know remocn. Three commands and you're rendering — the code lands in your repo, yours to tweak."
        />

        <div className="mt-12 grid items-start gap-4 sm:mt-16 sm:gap-6 md:grid-cols-2 md:gap-x-6 md:gap-y-6.5">
          <CompactStep
            step={START}
            delay={0}
            className="md:col-start-1 md:row-start-1"
          />
          <CompactStep
            step={INIT}
            delay={0.08}
            className="md:col-start-1 md:row-start-2"
          />
          <FeaturedStep
            step={ADD}
            delay={0.16}
            className="md:col-start-2 md:row-start-1 md:row-span-3"
          />
          <CompactStep
            step={RENDER}
            delay={0.24}
            className="md:col-start-1 md:row-start-3"
          />
        </div>
      </div>
    </section>
  );
}
