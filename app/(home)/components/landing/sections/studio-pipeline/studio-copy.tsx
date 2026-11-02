import { STUDIO_URL } from "@/config/site";
import { StudioDownloadButton } from "../../ui/download-button";
import { LandingButton } from "../../ui/landing-button";
import { StudioAppIcon } from "../../ui/remocn-mark";
import { SectionTitle } from "../../ui/section-title";

/** Left column of the Studio block: app badge, heading, pitch and CTAs. */
export function StudioCopy() {
  return (
    <div className="flex flex-col gap-[26px] md:gap-12 xl:w-[480px] xl:shrink-0 xl:justify-between">
      <div className="flex flex-col gap-[22px] md:gap-7">
        <div className="flex items-center gap-3">
          <StudioAppIcon
            size={44}
            radius={12}
            markSize={0}
            className="shadow-[inset_0_1px_0_#ffffff33]"
          />
          <div className="flex flex-col">
            <p className="text-[15px] leading-5 font-medium text-white">
              Remocn Studio
            </p>
            <p className="text-[13px] leading-[18px] text-[#9aa3a7]">
              macOS & Linux · free
            </p>
          </div>
        </div>
        <SectionTitle
          title="Seven stages."
          continuation="You watch, it ships."
          className="text-[34px]/[36px] text-white"
          continuationClassName="text-dark-muted"
        />
        <p className="text-[16px] leading-6 text-[#9aa3a7] md:text-[17px] md:leading-[26px]">
          The agent follows motion rules, checks every frame and fixes what
          looks off. It runs on the Claude Code, Codex, Copilot or Grok plan you
          already pay for.
        </p>
      </div>
      <div className="flex flex-col gap-2.5 md:flex-row">
        <StudioDownloadButton className="justify-center md:justify-start" />
        <LandingButton
          href={STUDIO_URL}
          target="_blank"
          rel="noreferrer"
          variant="dark-raised"
          size="studio"
        >
          See how it works
        </LandingButton>
      </div>
    </div>
  );
}
