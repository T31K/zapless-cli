import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { CONFIG } from "../config";
import { requireSession } from "../session";

function authHeaders(token: string) {
  return { "x-install-token": token };
}

export function registerSlides(program: Command) {
  const slides = program
    .command("slides")
    .description("Interact with the user's Google Slides");

  slides
    .command("commands")
    .description("List all available Slides commands")
    .action(() => {
      console.log(`
Slides commands:

  zapless slides list [--limit <n>]
  zapless slides get --id <presentation-id>
  zapless slides create --title "<title>"
`);
    });

  // list
  slides
    .command("list")
    .description("List Google Slides presentations")
    .option("--limit <n>", "Number of presentations", "20")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching presentations...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/slides/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit },
        });
        spinner.stop();
        const { presentations } = res.data;
        if (presentations.length === 0) {
          console.log(chalk.yellow("No presentations found."));
          return;
        }
        presentations.forEach((p: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${p.name}`));
          console.log(`    Modified: ${chalk.dim(p.modifiedTime)}`);
          console.log(`    ID:       ${chalk.dim(p.id)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list presentations");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // get
  slides
    .command("get")
    .description("Get details of a presentation")
    .requiredOption("--id <presentation-id>", "Presentation ID")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching presentation...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/slides/get`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id },
        });
        spinner.stop();
        const p = res.data;
        console.log(chalk.bold(`\n${p.title}`));
        console.log(`Slides: ${p.slideCount}`);
        if (p.revisionId) console.log(`Rev:    ${chalk.dim(p.revisionId)}`);
        console.log(`ID:     ${chalk.dim(p.id)}`);
      } catch (err: any) {
        spinner.fail("Failed to get presentation");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // create
  slides
    .command("create")
    .description("Create a new Google Slides presentation")
    .requiredOption("--title <title>", "Presentation title")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Creating presentation...").start();
      try {
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/slides/create`,
          { title: opts.title },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Presentation created — ID: ${chalk.cyan(res.data.id)}`));
      } catch (err: any) {
        spinner.fail("Failed to create presentation");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });
}
