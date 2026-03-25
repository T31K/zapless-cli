import { Command } from "commander";
import axios from "axios";
import ora from "ora";
import chalk from "chalk";
import { CONFIG } from "../config";
import { saveSession, clearSession, getSession } from "../session";

export function registerAuth(program: Command) {
  const auth = program
    .command("auth")
    .description("Manage authentication — login, logout, status");

  // zapless auth login --token <token>
  auth
    .command("login")
    .description("Authenticate with your install token from zapless.com/connect")
    .option("--token <token>", "Install token from zapless.com/connect")
    .action(async ({ token }: { token?: string }) => {
      if (!token) {
        console.log("Get your token at: https://zapless.com/connect");
        console.log("Then run: zapless auth login --token <your-token>");
        return;
      }

      const spinner = ora("Authenticating...").start();

      try {
        const res = await axios.post(`${CONFIG.SERVER_URL}/api/zapless/auth`, {
          install_token: token,
        });

        const { connected_apps, email } = res.data;

        saveSession({ install_token: token, connected_apps, email });

        spinner.succeed(chalk.green("Authenticated!"));

        if (connected_apps.length > 0) {
          console.log(`Connected: ${connected_apps.map((a: string) => chalk.cyan(a)).join(", ")}`);
        } else {
          console.log(chalk.yellow("No apps connected yet. Visit zapless.app/dashboard to connect apps."));
        }
      } catch (err: any) {
        spinner.fail("Authentication failed");
        if (err.response?.status === 401) {
          console.error("❌ Invalid token. Get your token at: zapless.app/dashboard");
        } else {
          console.error("❌ Server unreachable. Check your connection.");
        }
        process.exit(1);
      }
    });

  // zapless auth logout
  auth
    .command("logout")
    .description("Clear local session")
    .action(() => {
      clearSession();
      console.log(chalk.green("✅ Logged out."));
    });

  // zapless auth status
  auth
    .command("status")
    .description("Show current user and connected apps")
    .action(() => {
      const session = getSession();

      if (!session) {
        console.error("❌ Not authenticated. Run: zapless auth login --token <your-token>\n   Get your token at: https://zapless.com/connect");
        process.exit(1);
      }

      console.log(chalk.bold("Current session:"));
      if (session.email) {
        console.log(`  Email:  ${chalk.cyan(session.email)}`);
      }
      console.log(`  Token:  ${chalk.dim(session.install_token.slice(0, 8) + "...")}`);

      if (session.connected_apps.length > 0) {
        console.log(`  Apps:   ${session.connected_apps.map(a => chalk.green(a)).join(", ")}`);
      } else {
        console.log(`  Apps:   ${chalk.yellow("none — visit zapless.app/dashboard")}`);
      }
    });
}
