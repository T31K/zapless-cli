import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { CONFIG } from "../config";
import { requireSession } from "../session";

function authHeaders(token: string) {
  return { "x-install-token": token };
}

export function registerNotion(program: Command) {
  const notion = program
    .command("notion")
    .description("Interact with Notion");

  notion
    .command("commands")
    .description("List all available Notion commands")
    .action(() => {
      console.log(`
Notion commands:

  zapless notion pages list [--limit <n>]
  zapless notion pages get --id <page-id>
  zapless notion pages create --title "<title>" --parent <page-id> [--content "<text>"]
  zapless notion databases list [--limit <n>]
  zapless notion databases query --id <database-id> [--limit <n>]
`);
    });

  // ── pages ──────────────────────────────────────────────────────────────────

  const pages = notion.command("pages").description("Manage Notion pages");

  pages
    .command("list")
    .description("List Notion pages")
    .option("--limit <n>", "Number of pages", "20")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching pages...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/notion/pages/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit },
        });
        spinner.stop();
        const { pages } = res.data;
        if (pages.length === 0) {
          console.log(chalk.yellow("No pages found."));
          return;
        }
        pages.forEach((p: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${p.title}`));
          console.log(`    Edited: ${chalk.dim(p.last_edited)}`);
          console.log(`    URL:    ${chalk.blue(p.url)}`);
          console.log(`    ID:     ${chalk.dim(p.id)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list pages");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  pages
    .command("get")
    .description("Get a Notion page and its content")
    .requiredOption("--id <page-id>", "Page ID")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching page...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/notion/pages/get`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id },
        });
        spinner.stop();
        const p = res.data;
        console.log(chalk.bold(`\n${p.title}`));
        console.log(`Edited: ${chalk.dim(p.last_edited)}`);
        console.log(`URL:    ${chalk.blue(p.url)}`);
        if (p.content) {
          console.log(`\n${chalk.dim("─".repeat(40))}`);
          console.log(p.content);
        }
      } catch (err: any) {
        spinner.fail("Failed to get page");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  pages
    .command("create")
    .description("Create a new Notion page")
    .requiredOption("--title <title>", "Page title")
    .option("--parent <page-id>", "Parent page ID (omit to create at workspace root)")
    .option("--content <text>", "Initial page content")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Creating page...").start();
      try {
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/notion/pages/create`,
          { title: opts.title, parent_id: opts.parent, content: opts.content },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green("Page created!"));
        console.log(`URL: ${chalk.blue(res.data.url)}`);
        console.log(`ID:  ${chalk.dim(res.data.id)}`);
      } catch (err: any) {
        spinner.fail("Failed to create page");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // ── databases ──────────────────────────────────────────────────────────────

  const databases = notion.command("databases").description("Manage Notion databases");

  databases
    .command("list")
    .description("List Notion databases")
    .option("--limit <n>", "Number of databases", "20")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching databases...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/notion/databases/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit },
        });
        spinner.stop();
        const { databases } = res.data;
        if (databases.length === 0) {
          console.log(chalk.yellow("No databases found."));
          return;
        }
        databases.forEach((d: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${d.title}`));
          console.log(`    Edited: ${chalk.dim(d.last_edited)}`);
          console.log(`    URL:    ${chalk.blue(d.url)}`);
          console.log(`    ID:     ${chalk.dim(d.id)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list databases");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  databases
    .command("query")
    .description("Query a Notion database")
    .requiredOption("--id <database-id>", "Database ID")
    .option("--limit <n>", "Number of rows", "20")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Querying database...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/notion/databases/query`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id, limit: opts.limit },
        });
        spinner.stop();
        const { rows } = res.data;
        if (rows.length === 0) {
          console.log(chalk.yellow("No rows found."));
          return;
        }
        rows.forEach((r: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}]`));
          for (const [key, val] of Object.entries(r.properties)) {
            if (val !== null && val !== undefined && val !== '')
              console.log(`    ${chalk.dim(key + ":")} ${val}`);
          }
          console.log(`    URL: ${chalk.blue(r.url)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to query database");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });
}
