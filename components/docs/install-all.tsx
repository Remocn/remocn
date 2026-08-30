import { Frame, FramePanel } from "@/components/ui/frame";
import { INSTALL_ALL_COMMAND } from "@/config/site";
import { convertNpmCommand } from "@/lib/convert-npm-command";
import { CodeBlockCommand } from "./code-block-command";

export function InstallAll() {
  return (
    <Frame className="my-6">
      <FramePanel className="overflow-hidden p-0">
        <CodeBlockCommand
          component="all"
          variant="plain"
          prompt="Add every remocn component to my project."
          {...convertNpmCommand(INSTALL_ALL_COMMAND)}
        />
      </FramePanel>
    </Frame>
  );
}
