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

export function registerGmail(program: Command) {
  const gmail = program
    .command("gmail")
    .description("Gmail actions");

  // clawnect gmail send
  gmail
    .command("send")
    .description("Send an email")
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
        console.error("❌ Provide --body or --body-file");
        process.exit(1);
      }

      const spinner = ora(`Sending email to ${opts.to}...`).start();

      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/clawnect/gmail/send`,
          { to: opts.to, subject: opts.subject, body },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Email sent to ${opts.to}`));
      } catch (err: any) {
        spinner.fail("Failed to send email");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // clawnect gmail read
  gmail
    .command("read")
    .description("Read inbox")
    .option("--limit <n>", "Number of emails", "10")
    .option("--unread", "Only unread emails")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching inbox...").start();

      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/clawnect/gmail/read`, {
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
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // clawnect gmail search
  gmail
    .command("search")
    .description("Search emails")
    .requiredOption("--query <q>", "Gmail search query (e.g. 'from:boss subject:urgent')")
    .option("--limit <n>", "Number of results", "10")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora(`Searching for "${opts.query}"...`).start();

      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/clawnect/gmail/search`, {
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
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });
}
