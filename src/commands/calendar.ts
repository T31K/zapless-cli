import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { CONFIG } from "../config";
import { requireSession } from "../session";

function authHeaders(token: string) {
  return { "x-install-token": token };
}

export function registerCalendar(program: Command) {
  const calendar = program
    .command("calendar")
    .description("Interact with the user's Google Calendar");

  calendar
    .command("commands")
    .description("List all available Calendar commands")
    .action(() => {
      console.log(`
Calendar commands:

  zapless calendar list [--limit <n>]
  zapless calendar list --from <date> --to <date>
  zapless calendar get --id <event-id>
  zapless calendar create --title "<title>" --start "<datetime>" --end "<datetime>"
  zapless calendar create --title "<title>" --start "<datetime>" --end "<datetime>" --description "<text>"
  zapless calendar update --id <event-id> --title "<title>"
  zapless calendar update --id <event-id> --start "<datetime>" --end "<datetime>"
  zapless calendar delete --id <event-id>
`);
    });

  // list
  calendar
    .command("list")
    .description("List upcoming calendar events")
    .option("--limit <n>", "Number of events", "10")
    .option("--from <date>", "Start date (ISO 8601)")
    .option("--to <date>", "End date (ISO 8601)")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching events...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/calendar/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit, from: opts.from, to: opts.to },
        });
        spinner.stop();
        const { events } = res.data;
        if (events.length === 0) {
          console.log(chalk.yellow("No upcoming events."));
          return;
        }
        events.forEach((e: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${e.title}`));
          console.log(`    Start:  ${chalk.cyan(e.start)}`);
          console.log(`    End:    ${chalk.dim(e.end)}`);
          if (e.location) console.log(`    Where:  ${e.location}`);
          if (e.meetLink) console.log(`    Meet:   ${chalk.blue(e.meetLink)}`);
          console.log(`    ID:     ${chalk.dim(e.id)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list events");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // get
  calendar
    .command("get")
    .description("Get details of a specific calendar event")
    .requiredOption("--id <event-id>", "Event ID")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching event...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/calendar/get`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id },
        });
        spinner.stop();
        const e = res.data;
        console.log(chalk.bold(`\n${e.title}`));
        console.log(`Start:       ${chalk.cyan(e.start)}`);
        console.log(`End:         ${e.end}`);
        if (e.description) console.log(`Description: ${e.description}`);
        if (e.location) console.log(`Location:    ${e.location}`);
        if (e.meetLink) console.log(`Meet link:   ${chalk.blue(e.meetLink)}`);
        if (e.attendees?.length) console.log(`Attendees:   ${e.attendees.join(", ")}`);
        console.log(`ID:          ${chalk.dim(e.id)}`);
      } catch (err: any) {
        spinner.fail("Failed to get event");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // create
  calendar
    .command("create")
    .description("Create a calendar event")
    .requiredOption("--title <title>", "Event title")
    .requiredOption("--start <datetime>", "Start datetime (ISO 8601, e.g. 2026-03-25T10:00:00)")
    .requiredOption("--end <datetime>", "End datetime (ISO 8601)")
    .option("--description <text>", "Event description")
    .option("--location <location>", "Event location")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Creating event...").start();
      try {
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/calendar/create`,
          { title: opts.title, start: opts.start, end: opts.end, description: opts.description, location: opts.location },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Event created — ID: ${chalk.cyan(res.data.id)}`));
      } catch (err: any) {
        spinner.fail("Failed to create event");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // update
  calendar
    .command("update")
    .description("Update a calendar event")
    .requiredOption("--id <event-id>", "Event ID")
    .option("--title <title>", "New title")
    .option("--start <datetime>", "New start datetime")
    .option("--end <datetime>", "New end datetime")
    .option("--description <text>", "New description")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Updating event...").start();
      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/calendar/update`,
          { id: opts.id, title: opts.title, start: opts.start, end: opts.end, description: opts.description },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green("Event updated"));
      } catch (err: any) {
        spinner.fail("Failed to update event");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // delete
  calendar
    .command("delete")
    .description("Delete a calendar event")
    .requiredOption("--id <event-id>", "Event ID")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Deleting event...").start();
      try {
        await axios.delete(`${CONFIG.SERVER_URL}/api/zapless/calendar/delete`, {
          headers: authHeaders(session.install_token),
          data: { id: opts.id },
        });
        spinner.succeed(chalk.green("Event deleted"));
      } catch (err: any) {
        spinner.fail("Failed to delete event");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });
}
