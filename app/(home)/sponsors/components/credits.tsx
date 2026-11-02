import { RollPlayer } from "../../components/landing/ui/roll-player/roll-player";
import { SectionTitle } from "../../components/landing/ui/section-title";
import { getCreditGroups } from "./credits/credit-groups";
import { CreditsRoll } from "./credits/credits-roll";

/** "The people keeping remocn alive": sponsors as a film's end credits. */
export function CreditsSection() {
  return (
    <section
      id="sponsors"
      data-section="sponsors-credits"
      className="landing-container flex flex-col gap-10 pb-20 md:gap-14 md:pb-24"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionTitle
          title="The people keeping"
          continuation="remocn alive."
          continuationClassName="text-subtle"
        />
        <p className="text-[16px] leading-6 text-muted-foreground md:w-[400px] md:shrink-0 md:pb-1.5">
          The wonderful people and companies powering their videos with remocn.
        </p>
      </div>

      <RollPlayer label="credits">
        <CreditsRoll groups={getCreditGroups()} />
      </RollPlayer>
    </section>
  );
}
