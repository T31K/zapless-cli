import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { readFileSync } from "fs";
import { CONFIG } from "../config";
import { requireSession } from "../session";

function authHeaders(token: string) {
  return { "x-install-token": token };
}

const GMAIL_COMMANDS = `
Gmail commands:

  zapless gmail read --limit 10
  zapless gmail read --unread
  zapless gmail search --query "<query>" [--limit <n>]
  zapless gmail get --id <message-id>
  zapless gmail send --to <email> --subject "<subject>" --body "<text>"
  zapless gmail send --to <email> --subject "<subject>" --body-file <path>
  zapless gmail reply --id <message-id> --body "<text>"
  zapless gmail forward --id <message-id> --to <email>
  zapless gmail mark --id <message-id> --read
  zapless gmail mark --id <message-id> --unread
  zapless gmail trash --id <message-id>
  zapless gmail labels
  zapless gmail draft create --to <email> --subject "<subject>" --body "<text>"
  zapless gmail draft send --id <draft-id>
`;

export function registerGmail(program: Command) {
  const gmail = program
    .command("gmail")
    .description("Interact with the user's Gmail — send, read, search");

  gmail
    .command("commands")
    .description("List all available Gmail commands")
    .action(() => {
      console.log(GMAIL_COMMANDS);
    });

  // zapless gmail send
  gmail
    .command("send")
    .description("Send an email on the user's behalf")
    .requiredOption("--to <email>", "Recipient email")
    .requiredOption("--subject <subject>", "Email subject")
    .option("--body <text>", "Email body text")
    .option("--body-file <path>", "Read body from file")
    .action(async (opts) => {
      const session = requireSession();

      const body = opts.bodyFile
        ? readFileSync(opts.bodyFile, "utf-8")
        : opts.body;

      if (!body) {
        console.error("Provide --body or --body-file");
        process.exit(1);
      }

      const spinner = ora(`Sending email to ${opts.to}...`).start();

      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/gmail/send`,
          { to: opts.to, subject: opts.subject, body },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Email sent to ${opts.to}`));
      } catch (err: any) {
        spinner.fail("Failed to send email");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // zapless gmail read
  gmail
    .command("read")
    .description("Read the user's inbox")
    .option("--limit <n>", "Number of emails", "10")
    .option("--unread", "Only unread emails")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching inbox...").start();

      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/gmail/read`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit, unread: opts.unread ? "true" : undefined },
        });

        spinner.stop();
        const { emails } = res.data;

        if (emails.length === 0) {
          console.log(chalk.yellow("Inbox is empty."));
          return;
        }

        emails.forEach((email: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${email.subject}`));
          console.log(`    From:    ${chalk.cyan(email.from)}`);
          console.log(`    Date:    ${chalk.dim(email.date)}`);
          console.log(`    Preview: ${email.snippet}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to read inbox");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // zapless gmail search
  gmail
    .command("search")
    .description("Search the user's emails using Gmail query syntax")
    .requiredOption("--query <q>", "Gmail search query (e.g. 'from:boss subject:urgent')")
    .option("--limit <n>", "Number of results", "10")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora(`Searching for "${opts.query}"...`).start();

      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/gmail/search`, {
          headers: authHeaders(session.install_token),
          params: { query: opts.query, limit: opts.limit },
        });

        spinner.stop();
        const { emails, count } = res.data;

        if (count === 0) {
          console.log(chalk.yellow("No results found."));
          return;
        }

        console.log(chalk.dim(`Found ${count} result(s):\n`));
        emails.forEach((email: any, i: number) => {
          console.log(chalk.bold(`[${i + 1}] ${email.subject}`));
          console.log(`    From:    ${chalk.cyan(email.from)}`);
          console.log(`    Date:    ${chalk.dim(email.date)}`);
          console.log(`    Preview: ${email.snippet}\n`);
        });
      } catch (err: any) {
        spinner.fail("Search failed");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // zapless gmail get --id <id>
  gmail
    .command("get")
    .description("Get the full body of a specific email by ID")
    .requiredOption("--id <id>", "Message ID (from read or search results)")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching email...").start();

      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/gmail/get`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id },
        });

        spinner.stop();
        const e = res.data;

        console.log(chalk.bold(`\n${e.subject}`));
        console.log(`From:    ${chalk.cyan(e.from)}`);
        console.log(`To:      ${e.to}`);
        console.log(`Date:    ${chalk.dim(e.date)}`);
        console.log(`ID:      ${chalk.dim(e.id)}`);
        console.log(`Thread:  ${chalk.dim(e.threadId)}`);
        console.log(`\n${e.body || chalk.dim("(no body)")}`);
      } catch (err: any) {
        spinner.fail("Failed to get email");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // zapless gmail reply --id <id> --body <text>
  gmail
    .command("reply")
    .description("Reply to an email by message ID")
    .requiredOption("--id <id>", "Message ID to reply to")
    .option("--body <text>", "Reply body text")
    .option("--body-file <path>", "Read reply body from file")
    .action(async (opts) => {
      const session = requireSession();

      const body = opts.bodyFile
        ? readFileSync(opts.bodyFile, "utf-8")
        : opts.body;

      if (!body) {
        console.error("Provide --body or --body-file");
        process.exit(1);
      }

      const spinner = ora("Sending reply...").start();

      try {
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/gmail/reply`,
          { id: opts.id, body },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(res.data.message));
      } catch (err: any) {
        spinner.fail("Failed to send reply");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // zapless gmail forward --id <id> --to <email>
  gmail
    .command("forward")
    .description("Forward an email to another recipient")
    .requiredOption("--id <id>", "Message ID to forward")
    .requiredOption("--to <email>", "Recipient email address")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora(`Forwarding to ${opts.to}...`).start();

      try {
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/gmail/forward`,
          { id: opts.id, to: opts.to },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(res.data.message));
      } catch (err: any) {
        spinner.fail("Failed to forward email");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // zapless gmail trash --id <id>
  gmail
    .command("trash")
    .description("Move an email to trash")
    .requiredOption("--id <id>", "Message ID to trash")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Moving to trash...").start();

      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/gmail/trash`,
          { id: opts.id },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green("Email moved to trash"));
      } catch (err: any) {
        spinner.fail("Failed to trash email");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // zapless gmail mark --id <id> --read / --unread
  gmail
    .command("mark")
    .description("Mark an email as read or unread")
    .requiredOption("--id <id>", "Message ID")
    .option("--read", "Mark as read")
    .option("--unread", "Mark as unread")
    .action(async (opts) => {
      const session = requireSession();

      if (!opts.read && !opts.unread) {
        console.error("Provide --read or --unread");
        process.exit(1);
      }

      const read = !!opts.read;
      const spinner = ora(`Marking as ${read ? "read" : "unread"}...`).start();

      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/gmail/mark`,
          { id: opts.id, read },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Email marked as ${read ? "read" : "unread"}`));
      } catch (err: any) {
        spinner.fail("Failed to mark email");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // zapless gmail labels
  gmail
    .command("labels")
    .description("List all Gmail labels")
    .action(async () => {
      const session = requireSession();
      const spinner = ora("Fetching labels...").start();

      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/gmail/labels`, {
          headers: authHeaders(session.install_token),
        });

        spinner.stop();
        const { labels } = res.data;

        const system = labels.filter((l: any) => l.type === "system");
        const user = labels.filter((l: any) => l.type === "user");

        if (system.length > 0) {
          console.log(chalk.dim("\nSystem labels:"));
          system.forEach((l: any) => console.log(`  ${chalk.cyan(l.name)}  ${chalk.dim(l.id)}`));
        }
        if (user.length > 0) {
          console.log(chalk.dim("\nUser labels:"));
          user.forEach((l: any) => console.log(`  ${chalk.cyan(l.name)}  ${chalk.dim(l.id)}`));
        }
      } catch (err: any) {
        spinner.fail("Failed to list labels");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // zapless gmail draft create / send
  const draft = gmail
    .command("draft")
    .description("Manage Gmail drafts");

  draft
    .command("create")
    .description("Create a draft email")
    .requiredOption("--to <email>", "Recipient email")
    .requiredOption("--subject <subject>", "Email subject")
    .option("--body <text>", "Draft body text")
    .option("--body-file <path>", "Read body from file")
    .action(async (opts) => {
      const session = requireSession();

      const body = opts.bodyFile
        ? readFileSync(opts.bodyFile, "utf-8")
        : opts.body;

      if (!body) {
        console.error("Provide --body or --body-file");
        process.exit(1);
      }

      const spinner = ora("Creating draft...").start();

      try {
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/gmail/draft`,
          { to: opts.to, subject: opts.subject, body },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Draft created — ID: ${chalk.cyan(res.data.id)}`));
      } catch (err: any) {
        spinner.fail("Failed to create draft");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  draft
    .command("send")
    .description("Send an existing draft by ID")
    .requiredOption("--id <id>", "Draft ID")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Sending draft...").start();

      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/gmail/draft/send`,
          { id: opts.id },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green("Draft sent"));
      } catch (err: any) {
        spinner.fail("Failed to send draft");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });
}
