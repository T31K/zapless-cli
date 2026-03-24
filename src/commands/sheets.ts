import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { CONFIG } from "../config";
import { requireSession } from "../session";

function authHeaders(token: string) {
  return { "x-install-token": token };
}

export function registerSheets(program: Command) {
  const sheets = program
    .command("sheets")
    .description("Interact with the user's Google Sheets");

  sheets
    .command("commands")
    .description("List all available Sheets commands")
    .action(() => {
      console.log(`
Sheets commands:

  zapless sheets list [--limit <n>]
  zapless sheets get --id <sheet-id>
  zapless sheets read --id <sheet-id> --range <range>
  zapless sheets create --title "<title>"
  zapless sheets write --id <sheet-id> --range <range> --values "<csv>"
  zapless sheets append --id <sheet-id> --range <range> --values "<csv>"

Note: --values uses | to separate rows, commas for columns
  e.g. "Alice,30,NYC|Bob,25,LA"
`);
    });

  // list
  sheets
    .command("list")
    .description("List Google Sheets spreadsheets")
    .option("--limit <n>", "Number of sheets", "20")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching sheets...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/sheets/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit },
        });
        spinner.stop();
        const { sheets: list } = res.data;
        if (list.length === 0) {
          console.log(chalk.yellow("No sheets found."));
          return;
        }
        list.forEach((s: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${s.name}`));
          console.log(`    Modified: ${chalk.dim(s.modifiedTime)}`);
          console.log(`    ID:       ${chalk.dim(s.id)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list sheets");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // get
  sheets
    .command("get")
    .description("Get metadata for a spreadsheet")
    .requiredOption("--id <sheet-id>", "Spreadsheet ID")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching spreadsheet...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/sheets/get`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id },
        });
        spinner.stop();
        const s = res.data;
        console.log(chalk.bold(`\n${s.title}`));
        console.log(`Sheets: ${s.sheets.map((sh: any) => chalk.cyan(sh.title)).join(", ")}`);
        console.log(`ID:     ${chalk.dim(s.id)}`);
      } catch (err: any) {
        spinner.fail("Failed to get spreadsheet");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // read
  sheets
    .command("read")
    .description("Read values from a spreadsheet range")
    .requiredOption("--id <sheet-id>", "Spreadsheet ID")
    .requiredOption("--range <range>", "Range (e.g. Sheet1!A1:D10)")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Reading values...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/sheets/read`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id, range: opts.range },
        });
        spinner.stop();
        const { values } = res.data;
        if (!values || values.length === 0) {
          console.log(chalk.yellow("No data in range."));
          return;
        }
        values.forEach((row: string[]) => {
          console.log(row.join("\t"));
        });
      } catch (err: any) {
        spinner.fail("Failed to read sheet");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // create
  sheets
    .command("create")
    .description("Create a new Google Sheets spreadsheet")
    .requiredOption("--title <title>", "Spreadsheet title")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Creating spreadsheet...").start();
      try {
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/sheets/create`,
          { title: opts.title },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Spreadsheet created — ID: ${chalk.cyan(res.data.id)}`));
      } catch (err: any) {
        spinner.fail("Failed to create spreadsheet");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // write
  sheets
    .command("write")
    .description("Write values to a spreadsheet range (overwrites)")
    .requiredOption("--id <sheet-id>", "Spreadsheet ID")
    .requiredOption("--range <range>", "Range (e.g. Sheet1!A1)")
    .requiredOption("--values <csv>", "Values: rows separated by |, columns by comma (e.g. '1,2,3|4,5,6')")
    .action(async (opts) => {
      const session = requireSession();
      const values = opts.values.split("|").map((row: string) => row.split(","));
      const spinner = ora("Writing values...").start();
      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/sheets/write`,
          { id: opts.id, range: opts.range, values },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green("Values written"));
      } catch (err: any) {
        spinner.fail("Failed to write to sheet");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // append
  sheets
    .command("append")
    .description("Append rows to a spreadsheet")
    .requiredOption("--id <sheet-id>", "Spreadsheet ID")
    .requiredOption("--range <range>", "Range (e.g. Sheet1!A1)")
    .requiredOption("--values <csv>", "Values: rows separated by |, columns by comma (e.g. '1,2,3|4,5,6')")
    .action(async (opts) => {
      const session = requireSession();
      const values = opts.values.split("|").map((row: string) => row.split(","));
      const spinner = ora("Appending values...").start();
      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/sheets/append`,
          { id: opts.id, range: opts.range, values },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green("Values appended"));
      } catch (err: any) {
        spinner.fail("Failed to append to sheet");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });
}
