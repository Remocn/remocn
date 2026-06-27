import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type {
  MessageBubbleState,
  MessageBubbleVariant,
} from "@/registry/remocn-ui/message-bubble";

const DEFAULT_TEXT = "Yep, pushing it live now";
const DEFAULT_REACTION = "🔥";

export const messageBubbleConfig: ComponentConfig = {
  componentName: "MessageBubble",
  importPath: "@/components/remocn/message-bubble",
  controls: {
    text: { type: "text", default: DEFAULT_TEXT, label: "Text" },
    variant: {
      type: "select",
      default: "incoming",
      options: ["incoming", "outgoing"],
      label: "Variant",
    },
    reaction: { type: "text", default: DEFAULT_REACTION, label: "Reaction" },
    state: {
      type: "select",
      default: "visible",
      options: ["hidden", "visible"],
      label: "State",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as MessageBubbleState) ?? "visible";
    const variant = (values.variant as MessageBubbleVariant) ?? "incoming";
    const text = (values.text as string | undefined) ?? DEFAULT_TEXT;
    const reaction = values.reaction as string | undefined;

    const props: string[] = [`  state="${state}"`, `  variant="${variant}"`];
    if (reaction !== undefined && reaction !== "")
      props.push(`  reaction="${reaction}"`);

    return `import { MessageBubble } from "@/components/remocn/message-bubble";

<MessageBubble
${props.join("\n")}
>
  ${text}
</MessageBubble>`;
  },
};
