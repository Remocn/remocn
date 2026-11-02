import { OPENPANEL_DASHBOARD_URL } from "@/lib/sponsor-traffic";
import { LandingButton } from "../../../components/landing/ui/landing-button";
import { OpenPanelMark } from "./openpanel-mark";

const BUTTON = "h-[52px] w-full md:h-12 md:w-auto";

/** "Become a sponsor" and the live-traffic link (dashboard or the section). */
export function HeroActions() {
  const external = OPENPANEL_DASHBOARD_URL
    ? { target: "_blank", rel: "noreferrer" }
    : {};

  return (
    <div className="flex flex-col gap-2.5 pt-1 md:flex-row md:items-center md:pt-0">
      <LandingButton href="#tiers" size="md" arrow="→" className={BUTTON}>
        Become a sponsor
      </LandingButton>
      <LandingButton
        href={OPENPANEL_DASHBOARD_URL ?? "#traffic"}
        {...external}
        variant="secondary"
        size="md"
        arrow={<span className="text-muted-foreground">↗</span>}
        className={`${BUTTON} gap-2 px-[18px]`}
      >
        <OpenPanelMark className="h-[13px] w-[22px] shrink-0" />
        See our live traffic
      </LandingButton>
    </div>
  );
}
