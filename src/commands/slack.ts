import { handleApiError } from '../errors';
import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { CONFIG } from "../config";
import { requireSession } from "../session";

function authHeaders(token: string) {
  return { "x-install-token": token };
}

export function registerSlack(program: Command) {
  const slack = program
    .command("slack")
    .description("Interact with Slack");

  slack
    .command("commands")
    .description("List all available Slack commands")
    .action(() => {
      console.log(`
Slack commands:

  zapless slack channels list [--limit <n>]
  zapless slack messages send --channel <channel-id-or-name> --text "<text>"
  zapless slack members list [--limit <n>]
`);
    });

  // ── channels ───────────────────────────────────────────────────────────────

  const channels = slack.command("channels").description("Manage Slack channels");

  channels
    .command("list")
    .description("List Slack channels")
    .option("--limit <n>", "Number of channels", "50")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching channels...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/slack/channels/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit },
        });
        spinner.stop();
        const { channels } = res.data;
        if (channels.length === 0) {
          console.log(chalk.yellow("No channels found."));
          return;
        }
        channels.forEach((c: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] #${c.name}`));
          console.log(`    ID:      ${chalk.dim(c.id)}`);
          console.log(`    Type:    ${c.private ? chalk.yellow("private") : chalk.green("public")}`);
          console.log(`    Members: ${c.member_count}`);
          if (c.topic) console.log(`    Topic:   ${chalk.dim(c.topic)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list channels");
        handleApiError(err);
        process.exit(1);
      }
    });

  // ── messages ───────────────────────────────────────────────────────────────

  const messages = slack.command("messages").description("Send Slack messages");

  messages
    .command("send")
    .description("Send a message to a channel")
    .requiredOption("--channel <channel>", "Channel ID or name (e.g. #general or C12345)")
    .requiredOption("--text <text>", "Message text")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Sending message...").start();
      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/slack/messages/send`,
          { channel: opts.channel, text: opts.text },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Message sent to ${opts.channel}`));
      } catch (err: any) {
        spinner.fail("Failed to send message");
        handleApiError(err);
        process.exit(1);
      }
    });

  // ── members ────────────────────────────────────────────────────────────────

  const members = slack.command("members").description("List Slack workspace members");

  members
    .command("list")
    .description("List workspace members")
    .option("--limit <n>", "Number of members", "50")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching members...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/slack/members/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit },
        });
        spinner.stop();
        const { members } = res.data;
        if (members.length === 0) {
          console.log(chalk.yellow("No members found."));
          return;
        }
        members.forEach((m: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${m.real_name || m.name}`));
          console.log(`    Username: ${chalk.dim("@" + m.name)}`);
          if (m.email) console.log(`    Email:    ${chalk.dim(m.email)}`);
          if (m.title) console.log(`    Title:    ${chalk.dim(m.title)}`);
          console.log(`    ID:       ${chalk.dim(m.id)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list members");
        handleApiError(err);
        process.exit(1);
      }
    });
}
