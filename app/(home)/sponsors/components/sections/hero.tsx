import { LAVENDER, MINT, PEACH } from "@/config/site";
import { FadeUp } from "../../../components/fade-up";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-28 sm:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 dark:opacity-40"
        style={{
          background: `radial-gradient(60% 50% at 50% 20%, ${LAVENDER}22, transparent 70%), radial-gradient(40% 40% at 20% 80%, ${PEACH}18, transparent 60%), radial-gradient(40% 40% at 80% 20%, ${MINT}18, transparent 60%)`,
        }}
      />
      <div className="section">
        <div className="flex flex-col items-center text-center">
          <FadeUp delay={0.06}>
            <p className="mb-3 font-mono text-xs font-medium text-muted-foreground">
              Sponsors
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
              Support the future of video
            </h1>
          </FadeUp>
          <FadeUp delay={0.16}>
            <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              remocn is open-source and free. Your sponsorship helps us spend
              more time building premium animations and keeping the project
              alive.
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
