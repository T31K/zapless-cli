import { Command } from "commander";

const SHEETS_COMMANDS = `
Sheets commands:

  clawnect sheets list [--limit <n>]
  clawnect sheets get --id <sheet-id>
  clawnect sheets read --id <sheet-id> --range <range>
  clawnect sheets create --title "<title>"
  clawnect sheets write --id <sheet-id> --range <range> --values "<csv>"
  clawnect sheets append --id <sheet-id> --range <range> --values "<csv>"
`;

export function registerSheets(program: Command) {
  const sheets = program
    .command("sheets")
    .description("Interact with the user's Google Sheets");

  sheets
    .command("commands")
    .description("List all available Sheets commands")
    .action(() => {
      console.log(SHEETS_COMMANDS);
    });
}
