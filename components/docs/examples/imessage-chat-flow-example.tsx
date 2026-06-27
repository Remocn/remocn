"use client";

import { ImessageChatFlow } from "@/registry/remocn-ui/imessage-chat-flow";

export const ImessageChatFlowExampleScene = () => (
  <ImessageChatFlow
    contact={{ name: "shadcn", avatar: "https://unavatar.io/x/shadcn" }}
  />
);

export const imessageChatFlowExampleCode = (): string => {
  return `import { ImessageChatFlow } from "@/components/remocn/imessage-chat-flow";

export const Scene = () => (
  <ImessageChatFlow
    contact={{ name: "shadcn", avatar: "https://unavatar.io/x/shadcn" }}
    messages={[
      { from: "me", text: "Hey — ready for the demo?" },
      { from: "them", text: "Yep, pushing it live now", reaction: "❤️" },
      { from: "me", text: "Perfect, sending the link over", reaction: "👍" },
    ]}
  />
);`;
};
