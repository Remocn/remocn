import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type {
  MessageBubbleState,
  MessageBubbleVariant,
} from "@/registry/remocn-ui/message-bubble";

const DEFAULT_TEXT = "Yep, pushing it live now";
const _DEFAULT_REACTION = "🔥";

export const messageBubbleConfig: ComponentConfig = {
  componentName: "MessageBubble",
  importPath: "@/components/remocn/message-bubble",
  controls: {
    text: {
      type: "text-content",
      default: "Yep, pushing it live now",
      description: "Text",
    },
    variant: {
      type: "enum",
      default: "incoming",
      variants: {
        incoming: {},
        outgoing: {},
      },
      description: "Variant",
    },
    reaction: {
      type: "text-content",
      default: "🔥",
      description: "Reaction",
    },
    state: {
      type: "enum",
      default: "visible",
      variants: {
        hidden: {},
        visible: {},
      },
      description: "State",
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
