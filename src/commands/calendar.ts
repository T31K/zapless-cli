import { Command } from "commander";

const CALENDAR_COMMANDS = `
Calendar commands:

  clawnect calendar list [--limit <n>]
  clawnect calendar list --from <date> --to <date>
  clawnect calendar get --id <event-id>
  clawnect calendar create --title "<title>" --start "<datetime>" --end "<datetime>"
  clawnect calendar create --title "<title>" --start "<datetime>" --end "<datetime>" --description "<text>"
  clawnect calendar update --id <event-id> --title "<title>"
  clawnect calendar update --id <event-id> --start "<datetime>" --end "<datetime>"
  clawnect calendar delete --id <event-id>
`;

export function registerCalendar(program: Command) {
  const calendar = program
    .command("calendar")
    .description("Interact with the user's Google Calendar");

  calendar
    .command("commands")
    .description("List all available Calendar commands")
    .action(() => {
      console.log(CALENDAR_COMMANDS);
    });
}
