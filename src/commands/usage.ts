import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import { CONFIG } from "../config";
import { getSession } from "../session";

export function registerUsage(program: Command) {
  program
    .command("usage")
    .description("Show request usage for this billing period")
    .action(async () => {
      const session = getSession();
      if (!session) {
        console.error("Not authenticated. Run: zapless auth login");
        process.exit(1);
      }

      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/usage`, {
          headers: { 'x-install-token': session.install_token },
        });

        const { plan, requests_used, requests_limit, requests_left, resets_at } = res.data;
        const isPro = plan === 'pro';

        console.log(`\n  Plan:     ${isPro ? chalk.blue('Pro') : chalk.dim('Free')}`);

        if (isPro) {
          console.log(`  Requests: ${chalk.green('Unlimited')}`);
        } else {
          const pct = requests_used / requests_limit;
          const bar = buildBar(pct);
          const color = pct >= 0.9 ? chalk.red : pct >= 0.7 ? chalk.yellow : chalk.green;
          console.log(`  Requests: ${color(`${requests_used}/${requests_limit}`)}  ${bar}`);
          console.log(`  Left:     ${color(requests_left)}`);
          console.log(`  Resets:   ${chalk.dim(new Date(resets_at).toDateString())}`);
          if (requests_left === 0) {
            console.log(`\n  ${chalk.red('✗ Limit reached.')} Upgrade at ${chalk.cyan('zapless.app/upgrade')}\n`);
          } else if (requests_left <= 10) {
            console.log(`\n  ${chalk.yellow('⚠ Running low.')} Upgrade at ${chalk.cyan('zapless.app/upgrade')}\n`);
          }
        }
        console.log();
      } catch (err: any) {
        console.error(err.response?.data?.error ?? err.message);
        process.exit(1);
      }
    });
}

function buildBar(pct: number): string {
  const filled = Math.round(pct * 20);
  return chalk.dim('[') + chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(20 - filled)) + chalk.dim(']');
}
