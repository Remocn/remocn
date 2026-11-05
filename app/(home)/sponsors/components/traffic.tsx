import { getSponsorTrafficForPage } from "@/lib/sponsor-traffic";
import { SectionTitle } from "../../components/landing/ui/section-title";
import { BarList } from "./traffic/bar-list";
import { DevicesCard } from "./traffic/devices-card";
import { formatCountry } from "./traffic/format";
import { StatsColumn } from "./traffic/stats-column";
import { VisitorsCard } from "./traffic/visitors-card";

export async function TrafficSection() {
  const traffic = await getSponsorTrafficForPage();
  if (!traffic) return null;

  const countries = traffic.countries.map((row) => ({
    ...row,
    name: formatCountry(row.name),
  }));

  return (
    <section
      id="traffic"
      data-section="sponsors-traffic"
      className="landing-container flex flex-col gap-8 pt-6 pb-20 md:gap-10 xl:pb-[120px]"
    >
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between xl:gap-10">
        <div className="flex flex-col gap-4">
          <p className="text-caption text-primary">
            Live traffic, last 30 days
          </p>
          <SectionTitle
            title="Your logo, in front of"
            continuation="people who ship video."
            continuationClassName="text-subtle"
          />
        </div>
        <p className="text-ui leading-6 text-muted-foreground md:max-w-[400px] xl:w-[400px] xl:shrink-0 xl:pb-1.5">
          Numbers come straight from our public OpenPanel dashboard. Nothing
          rounded up for the pitch.
        </p>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row">
        <VisitorsCard traffic={traffic} />
        <StatsColumn traffic={traffic} />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <BarList
          title="Where they come from"
          rows={traffic.referrers}
          tone="fuchsia"
        />
        <BarList title="Top countries" rows={countries} tone="neutral" />
        <div className="grid md:col-span-2 xl:col-span-1">
          <DevicesCard devices={traffic.devices} />
        </div>
      </div>
    </section>
  );
}
