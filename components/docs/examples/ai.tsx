import type { ComponentType } from "react";
import { ChatGpt } from "@/registry/remocn/chat-gpt";
import { chatGptConfig } from "@/registry/remocn/chat-gpt/config";
import { ClaudeChat } from "@/registry/remocn/claude-chat";
import { claudeChatConfig } from "@/registry/remocn/claude-chat/config";
import { ClaudeCode } from "@/registry/remocn/claude-code";
import { claudeCodeConfig } from "@/registry/remocn/claude-code/config";
import { OpenCode } from "@/registry/remocn/opencode";
import { opencodeConfig } from "@/registry/remocn/opencode/config";
import { V0 } from "@/registry/remocn/v0";
import { v0Config } from "@/registry/remocn/v0/config";

export interface AiExampleEntry {
  Component: ComponentType;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

interface SceneConfig {
  durationInFrames: number;
  fps: number;
  compositionWidth: number;
  compositionHeight: number;
}

function entry(Component: ComponentType, config: SceneConfig): AiExampleEntry {
  return {
    Component,
    durationInFrames: config.durationInFrames,
    fps: config.fps,
    width: config.compositionWidth,
    height: config.compositionHeight,
  };
}

export const aiExamples: Record<string, AiExampleEntry> = {
  "claude-chat": entry(ClaudeChat, claudeChatConfig),
  "chat-gpt": entry(ChatGpt, chatGptConfig),
  v0: entry(V0, v0Config),
  "claude-code": entry(ClaudeCode, claudeCodeConfig),
  opencode: entry(OpenCode, opencodeConfig),
};
