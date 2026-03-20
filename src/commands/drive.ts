import { Command } from "commander";

const DRIVE_COMMANDS = `
Drive commands:

  clawnect drive list [--limit <n>]
  clawnect drive list --query "<query>"
  clawnect drive get --id <file-id>
  clawnect drive upload --file <path>
  clawnect drive upload --file <path> --folder <folder-id>
  clawnect drive download --id <file-id> --out <path>
  clawnect drive share --id <file-id> --email <email> --role viewer|editor
  clawnect drive delete --id <file-id>
`;

export function registerDrive(program: Command) {
  const drive = program
    .command("drive")
    .description("Interact with the user's Google Drive");

  drive
    .command("commands")
    .description("List all available Drive commands")
    .action(() => {
      console.log(DRIVE_COMMANDS);
    });
}
