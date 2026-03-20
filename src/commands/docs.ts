import { Command } from "commander";

const DOCS_COMMANDS = `
Docs commands:

  clawnect docs list [--limit <n>]
  clawnect docs get --id <doc-id>
  clawnect docs create --title "<title>"
  clawnect docs append --id <doc-id> --text "<text>"
`;

export function registerDocs(program: Command) {
  const docs = program
    .command("docs")
    .description("Interact with the user's Google Docs");

  docs
    .command("commands")
    .description("List all available Docs commands")
    .action(() => {
      console.log(DOCS_COMMANDS);
    });
}
