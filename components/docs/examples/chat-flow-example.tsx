"use client";

import { ChatFlow } from "@/registry/remocn-ui/chat-flow";

export const ChatFlowExampleScene = () => (
  <ChatFlow
    contact={{ name: "shadcn", avatar: "https://unavatar.io/x/shadcn" }}
  />
);

export const chatFlowExampleCode = (): string => {
  return `import { ChatFlow } from "@/components/remocn/chat-flow";

export const Scene = () => (
  <ChatFlow
    contact={{ name: "shadcn", avatar: "https://unavatar.io/x/shadcn" }}
    messages={[
      { from: "me", text: "Hey — ready for the demo?" },
      { from: "them", text: "Yep, pushing it live now", reaction: "🔥" },
      { from: "me", text: "Perfect, sending the link over", reaction: "👍" },
    ]}
  />
);`;
};
