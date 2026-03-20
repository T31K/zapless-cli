import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import { CONFIG } from "../config";
import { requireSession, saveSession } from "../session";

export function registerApps(program: Command) {
  const apps = program
    .command("apps")
    .description("Manage connected apps");

  apps
    .command("list")
    .description("List all connected apps (fetched live from server)")
    .action(async () => {
      const session = requireSession();

      try {
        const res = await axios.post(`${CONFIG.SERVER_URL}/api/clawnect/auth`, {
          install_token: session.install_token,
        });

        const { connected_apps, email } = res.data;

        // Keep session in sync
        saveSession({ ...session, connected_apps, email });

        if (connected_apps.length === 0) {
          console.log(chalk.yellow("No apps connected yet."));
          console.log(chalk.dim("Visit your Clawnect dashboard to connect apps."));
          return;
        }

        console.log(chalk.bold("\nConnected apps:\n"));
        connected_apps.forEach((app: string) => {
          console.log(`  ${chalk.green("+")} ${app}`);
        });
        console.log();
      } catch (err: any) {
        if (err.response?.status === 401) {
          console.error("❌ Invalid token. Run: clawnect auth login --token <your_install_token>");
        } else {
          console.error("❌ Server unreachable. Check your connection.");
        }
        process.exit(1);
      }
    });
}
