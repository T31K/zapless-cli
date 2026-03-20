import { Command } from "commander";

const SLIDES_COMMANDS = `
Slides commands:

  clawnect slides list [--limit <n>]
  clawnect slides get --id <presentation-id>
  clawnect slides create --title "<title>"
`;

export function registerSlides(program: Command) {
  const slides = program
    .command("slides")
    .description("Interact with the user's Google Slides");

  slides
    .command("commands")
    .description("List all available Slides commands")
    .action(() => {
      console.log(SLIDES_COMMANDS);
    });
}
