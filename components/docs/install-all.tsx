import { INSTALL_ALL_COMMAND } from "@/config/site";
import { convertNpmCommand } from "@/lib/convert-npm-command";
import { CodeBlockCommand } from "./code-block-command";

export function InstallAll() {
  return (
    <div className="my-6">
      <CodeBlockCommand
        component="all"
        variant="outline"
        prompt="Add every remocn component to my project."
        {...convertNpmCommand(INSTALL_ALL_COMMAND)}
      />
    </div>
  );
}
