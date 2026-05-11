"use client";

import { ArrowRight } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import {
  LAVENDER,
  MINT,
  PEACH,
  SECTION,
  SPRING_BOUNCE,
  SPRING_SOFT,
} from "@/config/landing";
import { useTrackEvent } from "@/lib/analytics";
import { FadeUp } from "../fade-up";

export function FinalCTA() {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const trackEvent = useTrackEvent();

  return (
    <section className="relative overflow-hidden py-24 sm:py-40">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(60% 50% at 50% 50%, ${LAVENDER}15, transparent 70%), radial-gradient(40% 40% at 20% 80%, ${PEACH}12, transparent 60%), radial-gradient(40% 40% at 80% 20%, ${MINT}12, transparent 60%)`,
          filter: "blur(40px)",
        }}
      />
      <div className={`${SECTION} flex flex-col items-center text-center`}>
        <motion.h2
          ref={ref}
          className="text-balance font-[var(--font-display)] text-3xl sm:text-5xl font-semibold -tracking-wide text-[#EDEDED] md:text-6xl"
          initial={
            reduced ? false : { opacity: 0, y: 30, filter: "blur(14px)" }
          }
          animate={
            inView
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: 30, filter: "blur(14px)" }
          }
          transition={{ ...SPRING_BOUNCE, duration: 1 }}
        >
          Stop fighting keyframes
          <br />
          Start writing code
        </motion.h2>

        <FadeUp delay={0.3}>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING_SOFT}
          >
            <Link
              href="/docs/getting-started/introduction"
              onClick={() =>
                trackEvent("cta_clicked", {
                  cta: "final_cta",
                  destination: "/docs/getting-started/introduction",
                })
              }
              className="mt-12 inline-flex h-14 items-center gap-2 rounded-full bg-white px-8 text-base font-medium text-[#141318] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141318]"
              style={{
                boxShadow: `0 0 0 1px rgba(255,255,255,0.2), 0 12px 50px ${LAVENDER}40, inset 0 1px 0 rgba(255,255,255,0.6)`,
              }}
            >
              View documentation
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </motion.div>
        </FadeUp>
      </div>
    </section>
  );
}
