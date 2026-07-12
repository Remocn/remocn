"use client";

import { ArrowRight } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  GITHUB_URL,
  LAVENDER,
  MINT,
  PEACH,
  SPRING_BOUNCE,
} from "@/config/site";
import { useTrackEvent } from "@/lib/analytics";
import { FadeUp } from "../fade-up";

export function FinalCTA() {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const trackEvent = useTrackEvent();

  return (
    <section className="relative py-14 sm:py-28">
      <div className="section">
        <div className="surface-card relative overflow-hidden rounded-3xl px-6 py-12 text-center sm:px-12 sm:py-20">
          {/* Restrained accent wash — low opacity so it reads in both themes. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-60 dark:opacity-40"
            style={{
              background: `radial-gradient(50% 60% at 50% 0%, ${LAVENDER}22, transparent 70%), radial-gradient(40% 50% at 15% 100%, ${PEACH}18, transparent 60%), radial-gradient(40% 50% at 85% 100%, ${MINT}18, transparent 60%)`,
            }}
          />

          <motion.h2
            ref={ref}
            className="mx-auto max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl"
            initial={
              reduced ? false : { opacity: 0, y: 24, filter: "blur(10px)" }
            }
            animate={
              inView
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: 24, filter: "blur(10px)" }
            }
            transition={{ ...SPRING_BOUNCE, duration: 0.8 }}
          >
            Stop fighting keyframes. Start writing code.
          </motion.h2>

          <FadeUp delay={0.2}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Install your first component and render a video today. It's open
              source, all the way down.
            </p>
          </FadeUp>

          <FadeUp delay={0.28}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 gap-2 rounded-full px-6 text-sm"
                render={
                  <Link
                    href="/docs/getting-started/introduction"
                    onClick={() =>
                      trackEvent("cta_clicked", {
                        cta: "final_cta",
                        destination: "/docs/getting-started/introduction",
                      })
                    }
                  />
                }
              >
                Read the documentation
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-full px-6 text-sm"
                render={
                  <Link href={GITHUB_URL} target="_blank" rel="noreferrer" />
                }
              >
                Star on GitHub
              </Button>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
