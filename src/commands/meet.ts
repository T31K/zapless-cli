import { Command } from "commander";

const MEET_COMMANDS = `
Meet commands:

  clawnect meet list [--limit <n>]
  clawnect meet get --id <event-id>
  clawnect meet create --title "<title>" --start "<datetime>" --end "<datetime>"
  clawnect meet create --title "<title>" --start "<datetime>" --end "<datetime>" --attendees <email1,email2>
`;

export function registerMeet(program: Command) {
  const meet = program
    .command("meet")
    .description("Interact with the user's Google Meet");

  meet
    .command("commands")
    .description("List all available Meet commands")
    .action(() => {
      console.log(MEET_COMMANDS);
    });
}
