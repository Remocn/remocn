import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CodeBlockCommand } from "@/components/docs/code-block-command";
import { SECTION } from "@/config/landing";
import { convertNpmCommand } from "@/lib/convert-npm-command";
import { FadeUp } from "../fade-up";
import { SectionHeading } from "../section-heading";

type Step = {
  title: string;
  description: string;
  command: string;
  component?: string;
};

const STEPS: Step[] = [
  {
    title: "Start with Remotion",
    description:
      "Already have a Remotion project? Skip ahead. Otherwise scaffold one in seconds.",
    command: "npx create-video@latest",
  },
  {
    title: "Add a component",
    description:
      "Pull any primitive or composition straight into your project with the shadcn CLI.",
    command: "npx shadcn@latest add remocn/blur-reveal",
    component: "blur-reveal",
  },
  {
    title: "Render your video",
    description:
      "Drop the component into a composition and export an mp4 — no editor required.",
    command: "npx remotion render",
  },
];

export function GetStarted() {
  return (
    <section id="get-started" className="relative py-20 sm:py-32">
      <div className={SECTION}>
        <SectionHeading
          eyebrow="Get started"
          title="Ship your first frame in minutes"
          lead="If you know shadcn/ui, you already know remocn. Three commands and you're rendering — the code lands in your repo, yours to tweak."
        />

        <div className="mt-12 flex flex-col gap-px overflow-hidden rounded-2xl border border-border bg-border sm:mt-16">
          {STEPS.map((step, i) => (
            <FadeUp key={step.title} delay={i * 0.08}>
              <div className="flex flex-col gap-5 bg-background p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
                <div className="flex items-start gap-4 sm:w-2/5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border font-mono text-sm font-medium text-muted-foreground tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
                <div className="sm:flex-1">
                  <CodeBlockCommand
                    component={step.component}
                    {...convertNpmCommand(step.command)}
                  />
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.1}>
          <div className="mt-8 flex justify-center">
            <Link
              href="/docs/getting-started/installation"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
            >
              Read the full installation guide
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
