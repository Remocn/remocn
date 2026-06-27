"use client";

import { TelegramChatFlow } from "@/registry/remocn-ui/telegram-chat-flow";

export const TelegramChatFlowExampleScene = () => (
  <TelegramChatFlow
    contact={{ name: "shadcn", avatar: "https://unavatar.io/x/shadcn" }}
  />
);

export const telegramChatFlowExampleCode = (): string => {
  return `import { TelegramChatFlow } from "@/components/remocn/telegram-chat-flow";

export const Scene = () => (
  <TelegramChatFlow
    contact={{ name: "shadcn", avatar: "https://unavatar.io/x/shadcn" }}
    messages={[
      { from: "me", text: "Hey — ready for the demo?", time: "9:40" },
      { from: "them", text: "Yep, pushing it live now", reaction: "🔥", time: "9:41" },
      { from: "me", text: "Perfect, sending the link over", reaction: "👍", time: "9:41" },
    ]}
  />
);`;
};
