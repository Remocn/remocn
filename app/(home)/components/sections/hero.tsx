"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTrackEvent } from "@/lib/analytics";
import { FadeUp } from "../fade-up";
import { HeroNeuroBg } from "../hero-shader-bg";
import { InstallAll } from "../install-all";
import { HeroScrollVideo } from "./hero-scroll-video";

export function Hero() {
  const trackEvent = useTrackEvent();

  return (
    <section className="relative isolate pt-10 pb-16 sm:pt-16 sm:pb-24">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-fade" />
        <HeroNeuroBg />
      </div>

      <div className="section">
        <div className="flex flex-col items-center text-center">
          <FadeUp delay={0.06} className="flex flex-col items-center">
            <Badge
              variant="outline"
              className="mb-5 h-7 gap-1.5 rounded-full px-3 text-xs"
              render={
                <Link
                  href="/docs/icons/gallery"
                  onClick={() =>
                    trackEvent("cta_clicked", {
                      cta: "hero_ui_badge",
                      destination: "/docs/icons/gallery",
                    })
                  }
                />
              }
            >
              <span className="font-semibold text-foreground">New</span>
              <span aria-hidden className="text-muted-foreground/60">
                ·
              </span>
              <span className="text-muted-foreground">
                Introducing{" "}
                <span className="text-foreground">Remocn Icons</span>
              </span>
              <ArrowRight className="size-3" aria-hidden="true" />
            </Badge>
            <h1 className="max-w-3xl text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Cinematic video components,
              <br className="hidden sm:block" /> now copy-pasteable
            </h1>
          </FadeUp>

          <FadeUp delay={0.12}>
            <p className="mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              Production-ready Remotion animations, transitions and backgrounds.
              Install with the shadcn CLI and own every line of code.
            </p>
          </FadeUp>

          <FadeUp delay={0.18}>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 gap-2 rounded-full px-6 text-sm"
                render={
                  <Link
                    href="/docs/getting-started/introduction"
                    onClick={() =>
                      trackEvent("cta_clicked", {
                        cta: "hero_browse",
                        destination: "/docs/getting-started/introduction",
                      })
                    }
                  />
                }
              >
                Browse components
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <InstallAll />
            </div>
          </FadeUp>
        </div>
      </div>

      <HeroScrollVideo />
    </section>
  );
}
