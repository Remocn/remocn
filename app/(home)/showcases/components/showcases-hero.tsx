import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FadeUp } from "../../components/fade-up";

export const SHOWCASES_DESCRIPTION =
  "Videos made with remocn — real products and launches, animated with copy-paste Remotion components.";

export function ShowcasesHero() {
  return (
    <section className="pt-10 pb-10 sm:pt-14 sm:pb-12">
      <div className="section">
        <div className="flex flex-col items-center text-center">
          <FadeUp delay={0.06}>
            <p className="mb-3 font-mono text-xs font-medium text-muted-foreground">
              Showcases
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Made with remocn
            </h1>
          </FadeUp>
          <FadeUp delay={0.16}>
            <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              {SHOWCASES_DESCRIPTION}
            </p>
          </FadeUp>
          <FadeUp delay={0.22}>
            <Button
              variant="outline"
              size="lg"
              className="mt-8 h-11 gap-2 rounded-full px-5 text-sm"
              render={<Link href="/docs/getting-started/introduction" />}
            >
              Start building
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
