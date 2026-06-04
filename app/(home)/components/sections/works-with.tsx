import { SECTION, STACK } from "@/config/landing";
import { FadeUp } from "../fade-up";

export function WorksWith() {
  return (
    <section className="relative border-y border-border py-12 sm:py-16">
      <div className={SECTION}>
        <FadeUp>
          <div className="flex flex-col items-center gap-8">
            <p className="font-mono text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              Built on tools you already use
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-10">
              {STACK.map((tool) => (
                <li
                  key={tool}
                  className="text-lg font-medium tracking-tight text-muted-foreground transition-colors hover:text-foreground sm:text-xl"
                >
                  {tool}
                </li>
              ))}
            </ul>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
