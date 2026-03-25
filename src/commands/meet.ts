import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { CONFIG } from "../config";
import { requireSession } from "../session";

function authHeaders(token: string) {
  return { "x-install-token": token };
}

export function registerMeet(program: Command) {
  const meet = program
    .command("meet")
    .description("Schedule Google Meet meetings via Calendar");

  meet
    .command("commands")
    .description("List all available Meet commands")
    .action(() => {
      console.log(`
Meet commands:

  zapless meet list [--limit <n>]
  zapless meet get --id <event-id>
  zapless meet create --title "<title>" --start "<datetime>" --end "<datetime>"
  zapless meet create --title "<title>" --start "<datetime>" --end "<datetime>" --attendees <email1,email2>
`);
    });

  // list
  meet
    .command("list")
    .description("List upcoming Google Meet meetings")
    .option("--limit <n>", "Number of meetings", "10")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching meetings...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/meet/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit },
        });
        spinner.stop();
        const { meetings } = res.data;
        if (meetings.length === 0) {
          console.log(chalk.yellow("No upcoming meetings with Meet links."));
          return;
        }
        meetings.forEach((m: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${m.title}`));
          console.log(`    Start:    ${chalk.cyan(m.start)}`);
          console.log(`    End:      ${chalk.dim(m.end)}`);
          console.log(`    Meet URL: ${chalk.blue(m.meetLink)}`);
          console.log(`    ID:       ${chalk.dim(m.id)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list meetings");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // get
  meet
    .command("get")
    .description("Get details of a specific meeting")
    .requiredOption("--id <event-id>", "Event ID")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching meeting...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/meet/get`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id },
        });
        spinner.stop();
        const m = res.data;
        console.log(chalk.bold(`\n${m.title}`));
        console.log(`Start:     ${chalk.cyan(m.start)}`);
        console.log(`End:       ${m.end}`);
        console.log(`Meet URL:  ${chalk.blue(m.meetLink)}`);
        if (m.attendees?.length) console.log(`Attendees: ${m.attendees.join(", ")}`);
        console.log(`ID:        ${chalk.dim(m.id)}`);
      } catch (err: any) {
        spinner.fail("Failed to get meeting");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // create
  meet
    .command("create")
    .description("Create a Google Meet meeting (calendar event with Meet link)")
    .requiredOption("--title <title>", "Meeting title")
    .requiredOption("--start <datetime>", "Start datetime (ISO 8601, e.g. 2026-03-25T10:00:00)")
    .requiredOption("--end <datetime>", "End datetime (ISO 8601)")
    .option("--attendees <emails>", "Comma-separated attendee emails")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Creating meeting...").start();
      try {
        const attendees = opts.attendees
          ? opts.attendees.split(",").map((e: string) => e.trim())
          : [];
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/meet/create`,
          { title: opts.title, start: opts.start, end: opts.end, attendees },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green("Meeting created!"));
        console.log(`Meet URL: ${chalk.blue(res.data.meetLink)}`);
        console.log(`ID:       ${chalk.dim(res.data.id)}`);
      } catch (err: any) {
        spinner.fail("Failed to create meeting");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });
}
