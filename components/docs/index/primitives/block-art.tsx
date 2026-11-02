import type { ReactNode } from "react";

/**
 * Still artwork for the block tiles, keyed by registry name. Blocks are dark
 * scenes, so these use fixed colours that read the same in both themes.
 */
const CURSOR_PATH = "M4 3l15 7.5-6.5 1.8L9.5 19Z";
const CHECK_PATH = "m5 12.5 4.5 4.5L19 7.5";
const bubble = "flex h-7 shrink-0 items-center px-3 text-micro leading-[14px]";

export const BLOCK_ART: Record<string, { bg: string; art: ReactNode }> = {
  "chat-flow": {
    bg: "bg-[#0e1012]",
    art: (
      <span className="flex size-full flex-col justify-center gap-[7px] px-10">
        <span
          className={`${bubble} self-start rounded-control bg-[#2a2e31] text-[#fafafa]`}
        >
          Did the new build ship?
        </span>
        <span
          className={`${bubble} self-end rounded-control bg-[#fafafa] text-[#0e1012]`}
        >
          Live since 9:40, all green
        </span>
        <span className="flex h-7 items-center gap-1 self-start rounded-control bg-[#2a2e31] px-3">
          <span className="size-1.5 rounded-full bg-[#9aa3a7]" />
          <span className="size-1.5 rounded-full bg-[#fafafa]" />
          <span className="size-1.5 rounded-full bg-[#9aa3a7]" />
        </span>
      </span>
    ),
  },
  "telegram-chat-flow": {
    bg: "bg-[#17212b]",
    art: (
      <span className="flex size-full flex-col justify-center gap-[7px] px-10">
        <span
          className={`${bubble} self-start rounded-t-control-sm rounded-br-control-sm rounded-bl-[4px] bg-[#182533] text-[#fafafa]`}
        >
          Can you send the deck?
        </span>
        <span
          className={`${bubble} gap-1.5 self-end rounded-t-control-sm rounded-br-[4px] rounded-bl-control-sm bg-[#2b5278] pr-2.5 text-[#fafafa]`}
        >
          Sent, check your inbox
          <svg
            viewBox="0 0 28 20"
            className="h-2.5 w-3.5 fill-none stroke-[#6ab3f3] stroke-[2.5] [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d="m2 10 5 5L17 4M11 14l1.5 1.5L23 4" />
          </svg>
        </span>
        <span className="flex h-[22px] items-center gap-1 self-end rounded-[11px] bg-[#22303e] px-2 text-micro leading-[14px] text-[#fafafa]">
          <svg viewBox="0 0 24 24" className="size-[11px] fill-[#f87171]">
            <path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10Z" />
          </svg>
          2
        </span>
      </span>
    ),
  },
  "imessage-chat-flow": {
    bg: "bg-black",
    art: (
      <span className="flex size-full flex-col justify-center gap-1.5 px-10">
        <span
          className={`${bubble} self-start rounded-control bg-[#3a3a3c] text-white`}
        >
          Dinner at 8?
        </span>
        <span
          className={`${bubble} self-end rounded-control bg-[#0a84ff] text-white`}
        >
          Perfect, I will book it
        </span>
        <span className="self-end text-[9px] leading-3 text-[#8e8e93]">
          Delivered
        </span>
      </span>
    ),
  },
  "signup-flow": {
    bg: "bg-[#0e1012]",
    art: (
      <span className="relative flex size-full items-center justify-center">
        <span className="flex w-[168px] flex-col gap-1.5 rounded-control-sm bg-white p-3 text-[9px] leading-3 text-[#0e1012]">
          <span className="text-micro leading-[14px] font-medium">
            Create your account
          </span>
          <span className="flex h-[22px] items-center rounded-tag border border-[#e4e5e7] px-[7px]">
            ada@lovelace.dev
          </span>
          <span className="flex h-[22px] items-center rounded-tag border-[1.5px] border-[#0e1012] px-[7px]">
            ••••••••
          </span>
          <span className="flex h-6 items-center justify-center rounded-tag bg-[#0e1012] text-[#fafafa]">
            Sign up
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          className="absolute top-[112px] left-[calc(50%+53px)] size-[18px] fill-white stroke-[#0e1012] stroke-[1.5] [stroke-linejoin:round]"
        >
          <path d={CURSOR_PATH} />
        </svg>
      </span>
    ),
  },
  "checkout-flow": {
    bg: "bg-[#0e1012]",
    art: (
      <span className="flex size-full items-center justify-center">
        <span className="flex w-44 flex-col gap-1.5 rounded-control-sm bg-white p-3 text-[9px] leading-3 text-[#0e1012]">
          <span className="flex gap-0.5 rounded-[7px] bg-[#f4f4f5] p-0.5">
            <span className="flex h-[18px] grow basis-0 items-center justify-center text-[#5f6b70]">
              Monthly
            </span>
            <span className="flex h-[18px] grow basis-0 items-center justify-center rounded-[5px] bg-white shadow-[0_1px_2px_rgb(14_16_18/12%)]">
              Yearly
            </span>
          </span>
          <span className="flex h-[22px] items-center rounded-tag border border-[#e4e5e7] px-[7px] tabular-nums">
            4242 4242 4242 4242
          </span>
          <span className="flex items-center gap-[5px] text-[#2a2e31]">
            <span className="flex size-[11px] items-center justify-center rounded-[3px] bg-[#0e1012]">
              <svg
                viewBox="0 0 24 24"
                className="size-[7px] fill-none stroke-white stroke-4 [stroke-linecap:round] [stroke-linejoin:round]"
              >
                <path d={CHECK_PATH} />
              </svg>
            </span>
            I agree to the terms
          </span>
          <span className="flex h-6 items-center justify-center rounded-tag bg-[#0e1012] text-[#fafafa]">
            Pay $96
          </span>
        </span>
      </span>
    ),
  },
  "onboarding-stepper-flow": {
    bg: "bg-[#0e1012]",
    art: (
      <span className="flex size-full flex-col items-center justify-center gap-3">
        <span className="flex items-center gap-1.5 text-[10px] leading-3 font-medium">
          <span className="flex size-5 items-center justify-center rounded-full bg-[#fafafa]">
            <svg
              viewBox="0 0 24 24"
              className="size-2.5 fill-none stroke-[#0e1012] stroke-[3.5] [stroke-linecap:round] [stroke-linejoin:round]"
            >
              <path d={CHECK_PATH} />
            </svg>
          </span>
          <span className="h-1 w-7 rounded-[2px] bg-[#fafafa]" />
          <span className="flex size-5 items-center justify-center rounded-full bg-[#fafafa] text-[#0e1012]">
            2
          </span>
          <span className="h-1 w-7 rounded-[2px] bg-[#2a2e31]" />
          <span className="flex size-5 items-center justify-center rounded-full bg-[#2a2e31] font-normal text-[#9aa3a7]">
            3
          </span>
        </span>
        <span className="flex w-[168px] flex-col gap-1.5 rounded-[10px] bg-[#1a1c1e] p-2.5">
          <span className="text-[10px] leading-3 font-medium text-[#fafafa]">
            Name your workspace
          </span>
          <span className="flex h-[22px] items-center rounded-tag bg-[#2a2e31] px-[7px] text-[9px] leading-3 text-[#fafafa]">
            Northwind Studio
          </span>
        </span>
      </span>
    ),
  },
  "ai-prompt-flow": {
    bg: "bg-[#0e1012]",
    art: (
      <span className="flex size-full flex-col items-center justify-center gap-2">
        <span className="flex h-[34px] w-[220px] items-center gap-2 rounded-[10px] bg-[#1a1c1e] pr-[5px] pl-2.5">
          <span className="grow text-[10px] leading-3 text-[#fafafa]">
            Summarize this week's releases
          </span>
          <span className="flex size-6 items-center justify-center rounded-[7px] bg-[#fafafa]">
            <svg
              viewBox="0 0 24 24"
              className="size-3 fill-none stroke-3 [stroke-linecap:round]"
            >
              <circle cx="12" cy="12" r="8" className="stroke-[#0e1012]/25" />
              <path d="M12 4a8 8 0 0 1 8 8" className="stroke-[#0e1012]" />
            </svg>
          </span>
        </span>
        <span className="flex w-[220px] flex-col gap-[5px] rounded-[10px] bg-[#1a1c1e] p-2.5">
          <span className="h-[7px] w-[180px] rounded-[4px] bg-[#2a2e31]" />
          <span className="h-[7px] w-[150px] rounded-[4px] bg-[#2a2e31]" />
          <span className="h-[7px] w-[110px] rounded-[4px] bg-[#2a2e31]" />
        </span>
      </span>
    ),
  },
  "settings-toggle-flow": {
    bg: "bg-[#0e1012]",
    art: (
      <span className="flex size-full items-center justify-center">
        <span className="flex w-[236px] gap-3 rounded-control-sm bg-white p-3 text-[9px] leading-3 text-[#0e1012]">
          <span className="flex w-[62px] shrink-0 flex-col gap-1.5">
            <span className="font-medium">General</span>
            <span className="text-[#5f6b70]">Billing</span>
            <span className="text-[#5f6b70]">Team</span>
          </span>
          <span className="flex grow flex-col gap-2">
            <span className="flex items-center justify-between">
              Notifications
              <span className="flex h-3.5 w-6 justify-end rounded-[7px] bg-[#0e1012] p-0.5">
                <span className="size-2.5 rounded-full bg-white" />
              </span>
            </span>
            <span className="flex items-center justify-between">
              Region
              <span className="flex h-4 items-center rounded-[4px] border border-[#e4e5e7] px-[5px] text-[8px] leading-[10px]">
                eu-west
              </span>
            </span>
            <span className="flex h-[18px] items-center self-end rounded-[5px] bg-[#0e1012] px-2 text-[8px] leading-[10px] text-[#fafafa]">
              Save
            </span>
          </span>
        </span>
      </span>
    ),
  },
};
