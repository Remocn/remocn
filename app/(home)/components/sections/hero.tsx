"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTrackEvent } from "@/lib/analytics";
import { FadeUp } from "../fade-up";
import { HeroBadge } from "../hero-badge";
import { HeroPhosphorBg } from "../hero-phosphor-bg";
import { HeroScrollVideo } from "./hero-scroll-video";

export function Hero() {
  const trackEvent = useTrackEvent();

  return (
    <section className="relative isolate pt-8 pb-12 sm:pt-16 sm:pb-24">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-fade" />
        <HeroPhosphorBg />
      </div>

      <div className="section">
        <div className="flex flex-col items-center text-center">
          <FadeUp
            gate="landing-intro"
            delay={0.06}
            className="flex flex-col items-center"
          >
            <HeroBadge />
            <h1 className="max-w-3xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl">
              You want the video,
              <br className="hidden sm:block" /> not the ordeal.
            </h1>
          </FadeUp>

          <FadeUp gate="landing-intro" delay={0.12}>
            <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              Describe your product to your AI agent. It builds the demo video
              from ready-made pieces while you watch in the browser.
            </p>
          </FadeUp>

          <FadeUp gate="landing-intro" delay={0.18}>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="rounded-full"
                render={
                  <Link
                    href="/docs/guides/setup"
                    onClick={() =>
                      trackEvent("cta_clicked", {
                        cta: "hero_start",
                        destination: "/docs/guides/setup",
                      })
                    }
                  />
                }
              >
                Make your first video
                <ArrowRight
                  data-icon="inline-end"
                  className="size-4"
                  aria-hidden="true"
                />
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full font-medium"
                render={
                  <Link
                    href="/showcases"
                    onClick={() =>
                      trackEvent("cta_clicked", {
                        cta: "hero_showcases",
                        destination: "/showcases",
                      })
                    }
                  />
                }
              >
                See what ships
              </Button>
            </div>
          </FadeUp>
        </div>
      </div>

      <HeroScrollVideo />
    </section>
  );
}
