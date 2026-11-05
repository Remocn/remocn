import { LandingButton } from "../../../components/landing/ui/landing-button";
import { CreditEntry } from "./credit-entry";
import type { CreditGroup } from "./credit-groups";

/**
 * The film's end credits: a title card, one row per sponsor tier (role on the
 * left, names on the right) and the end card. Real text and links, so the full
 * list reads the same to screen readers whatever the roll is doing.
 */
export function CreditsRoll({ groups }: { groups: CreditGroup[] }) {
  return (
    <div className="flex flex-col items-center gap-14 px-5 pt-[72px] pb-24 sm:px-8 md:pt-[88px]">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <p className="text-caption text-dark-subtle">End credits</p>
        <h3 className="text-[32px] leading-9 tracking-[-0.04em] text-[#fafafa] md:text-[40px] md:leading-11">
          Made possible by
        </h3>
      </div>

      <dl className="flex w-full max-w-[720px] flex-col gap-10">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex flex-col items-center sm:grid sm:grid-cols-2 sm:items-start sm:gap-x-16"
          >
            <dt className="mb-2 flex flex-col items-center justify-center text-center sm:col-start-1 sm:mb-0 sm:h-10 sm:items-end sm:text-right">
              <span className="text-[17px] leading-[22px] text-[#fafafa]">
                {group.role}
              </span>
              <span className="text-caption text-dark-subtle">
                {group.placement}
              </span>
            </dt>
            {group.entries.map((entry) => (
              <dd
                key={entry.id}
                className="flex h-10 items-center sm:col-start-2"
              >
                <CreditEntry entry={entry} />
              </dd>
            ))}
          </div>
        ))}
      </dl>

      <div
        data-roll-end
        className="flex flex-col items-center gap-5 pt-6 text-center"
      >
        <p className="text-[22px] leading-7 tracking-[-0.03em] text-balance text-[#fafafa] md:text-[28px] md:leading-[34px]">
          Your name could roll here next.
        </p>
        <LandingButton href="#tiers" variant="light" size="md" arrow="→">
          Become a sponsor
        </LandingButton>
      </div>
    </div>
  );
}
