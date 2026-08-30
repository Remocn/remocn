"use client";

import { ArrowRight, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SPRING_SOFT } from "@/config/site";
import { type BillingMode, type Tier, tiers } from "@/config/sponsors";
import { cn } from "@/lib/utils";

function BillingToggle({
  value,
  onChange,
}: {
  value: BillingMode;
  onChange: (v: BillingMode) => void;
}) {
  const reduced = useReducedMotion();
  const options: { id: BillingMode; label: string }[] = [
    { id: "monthly", label: "Monthly" },
    { id: "one-time", label: "One-time" },
  ];

  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1">
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <Button
            key={opt.id}
            variant="ghost"
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative rounded-full px-5 text-sm font-medium transition-colors duration-200 before:absolute before:inset-x-0 before:-inset-y-2 before:content-['']",
              active
                ? "text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.div
                layoutId="billing-thumb"
                className="absolute inset-0 rounded-full bg-foreground"
                transition={reduced ? { duration: 0 } : SPRING_SOFT}
              />
            )}
            <span className="relative">{opt.label}</span>
          </Button>
        );
      })}
    </div>
  );
}

function TierCard({
  tier,
  billingMode,
}: {
  tier: Tier;
  billingMode: BillingMode;
}) {
  const reduced = useReducedMotion();
  const checkoutUrl =
    billingMode === "monthly" ? tier.monthlyUrl : tier.oneTimeUrl;
  const priceSuffix = billingMode === "monthly" ? "/mo" : "one-time";

  return (
    <article
      className={cn(
        "surface-card flex h-full flex-col rounded-3xl p-8",
        tier.highlighted && "surface-card-highlighted",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-foreground">
            {tier.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{tier.tagline}</p>
        </div>
        {tier.badge && <Badge variant="secondary">{tier.badge}</Badge>}
      </div>

      <div className="mt-6 overflow-hidden">
        <motion.div
          key={billingMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : SPRING_SOFT}
          className="flex items-baseline gap-2"
        >
          <span className="text-4xl font-semibold tracking-tight tabular-nums text-foreground">
            ${tier.price}
          </span>
          <span className="text-sm text-muted-foreground">{priceSuffix}</span>
        </motion.div>
      </div>

      <Separator className="my-6 bg-border" />

      <ul className="flex flex-col gap-3">
        {tier.perks.map((perk) => (
          <li
            key={perk}
            className="flex items-start gap-3 text-sm text-muted-foreground"
          >
            <Check
              className="mt-[3px] size-3.5 shrink-0 text-foreground"
              aria-hidden="true"
            />
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-10">
        <Button
          variant={tier.highlighted ? "default" : "outline"}
          size="lg"
          className="h-11 w-full gap-2 rounded-full"
          render={
            // biome-ignore lint/a11y/useAnchorContent: Base UI render prop merges the button children into this anchor
            <a href={checkoutUrl} target="_blank" rel="noreferrer" />
          }
        >
          Become a {tier.name}
          <ArrowRight
            data-icon="inline-end"
            className="size-4"
            aria-hidden="true"
          />
        </Button>
      </div>
    </article>
  );
}

export function Tiers() {
  const [billingMode, setBillingMode] = useState<BillingMode>("monthly");

  return (
    <section id="tiers" className="relative py-12 sm:py-16">
      <div className="section">
        <div className="mb-8 flex justify-center">
          <BillingToggle value={billingMode} onChange={setBillingMode} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <TierCard key={tier.id} tier={tier} billingMode={billingMode} />
          ))}
        </div>
      </div>
    </section>
  );
}
