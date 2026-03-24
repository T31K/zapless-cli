import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { CONFIG } from "../config";
import { requireSession } from "../session";

function authHeaders(token: string) {
  return { "x-install-token": token };
}

export function registerDocs(program: Command) {
  const docs = program
    .command("docs")
    .description("Interact with the user's Google Docs");

  docs
    .command("commands")
    .description("List all available Docs commands")
    .action(() => {
      console.log(`
Docs commands:

  zapless docs list [--limit <n>]
  zapless docs get --id <doc-id>
  zapless docs create --title "<title>"
  zapless docs append --id <doc-id> --text "<text>"
`);
    });

  // list
  docs
    .command("list")
    .description("List Google Docs")
    .option("--limit <n>", "Number of docs", "20")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching docs...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/docs/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit },
        });
        spinner.stop();
        const { docs: list } = res.data;
        if (list.length === 0) {
          console.log(chalk.yellow("No docs found."));
          return;
        }
        list.forEach((d: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${d.name}`));
          console.log(`    Modified: ${chalk.dim(d.modifiedTime)}`);
          console.log(`    ID:       ${chalk.dim(d.id)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list docs");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // get
  docs
    .command("get")
    .description("Get the content of a Google Doc")
    .requiredOption("--id <doc-id>", "Document ID")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching doc...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/docs/get`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id },
        });
        spinner.stop();
        const d = res.data;
        console.log(chalk.bold(`\n${d.title}`));
        console.log(`ID: ${chalk.dim(d.id)}\n`);
        console.log(d.text || chalk.dim("(empty document)"));
      } catch (err: any) {
        spinner.fail("Failed to get doc");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // create
  docs
    .command("create")
    .description("Create a new Google Doc")
    .requiredOption("--title <title>", "Document title")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Creating doc...").start();
      try {
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/docs/create`,
          { title: opts.title },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Doc created — ID: ${chalk.cyan(res.data.id)}`));
      } catch (err: any) {
        spinner.fail("Failed to create doc");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // append
  docs
    .command("append")
    .description("Append text to a Google Doc")
    .requiredOption("--id <doc-id>", "Document ID")
    .requiredOption("--text <text>", "Text to append")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Appending to doc...").start();
      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/docs/append`,
          { id: opts.id, text: opts.text },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green("Text appended to doc"));
      } catch (err: any) {
        spinner.fail("Failed to append to doc");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });
}
