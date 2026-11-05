import { COMPONENT_COUNT, STUDIO_URL } from "@/config/site";
import { MetalRing } from "../../ui/metal-ring";
import { StudioAppIcon } from "../../ui/remocn-mark";
import {
  AgentLine,
  ComposerLoop,
  PickedRow,
  TypedPrompt,
} from "./composer/composer-loop";

/**
 * Illustration of agents using the remocn skill: prompts type themselves,
 * get selected and replaced, the agent swaps and its picked blocks ripple in.
 * Not a real input: the send button is decorative; "Run in Remocn Studio" and
 * the picked chips are live links.
 */
export function PromptComposer() {
  return (
    <div className="px-5 md:px-10">
      <ComposerLoop
        label="Example prompts: AI agents building product videos with Remocn blocks"
        className="relative mx-auto flex w-full max-w-[860px] flex-col rounded-panel bg-surface p-2 shadow-[0_0_0_1px_#0E10120F,0_24px_60px_-20px_#0E101233] md:rounded-shell md:p-2.5"
      >
        <div className="flex flex-col gap-5 rounded-[18px] bg-surface-muted px-[18px] pt-5 pb-4 md:gap-7 md:rounded-card md:px-7 md:pt-[26px] md:pb-[22px]">
          <AgentLine />

          <TypedPrompt className="text-[20px] leading-7 tracking-title text-foreground md:text-quote md:leading-9" />

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="flex items-center gap-2 text-subtle md:gap-0">
              <span className="text-mono md:text-caption">Remocn skill</span>
              <span className="hidden text-caption whitespace-pre md:inline">
                {" · "}
              </span>
              <span className="text-caption tabular-nums">
                {COMPONENT_COUNT} blocks available
              </span>
            </p>

            <div className="flex items-center gap-2">
              <a
                href={STUDIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex h-[46px] flex-1 items-center gap-2 rounded-[14px] border-2 border-metal pr-3.5 pl-1.5 text-[15px] leading-[18px] text-foreground shadow-[0_1px_2px_#0E10121F,0_4px_16px_#A800B724] outline-none transition-shadow duration-150 hover:shadow-[0_1px_2px_#0E10121F,0_6px_20px_#A800B740] focus-visible:ring-3 focus-visible:ring-ring md:h-11 md:flex-none md:text-[14px]"
              >
                <StudioAppIcon size={30} radius={8} className="md:hidden" />
                <StudioAppIcon
                  size={28}
                  radius={8}
                  className="hidden md:flex"
                />
                Run in Remocn Studio
                <MetalRing width={2} />
              </a>
              <span
                aria-hidden="true"
                className="flex size-[46px] shrink-0 items-center justify-center rounded-control-sm bg-foreground text-background md:size-10"
              >
                <svg viewBox="0 0 24 24" className="size-[18px]">
                  <path
                    d="M12 19V5M5 12l7-7 7 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-clip pt-3 pb-1 pl-2.5 md:px-[18px] md:pt-4 md:pb-2">
          <span className="shrink-0 pr-1 text-caption text-subtle md:pr-1.5 md:text-mono">
            Picked
          </span>
          <PickedRow />
        </div>
      </ComposerLoop>
    </div>
  );
}
