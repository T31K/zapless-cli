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

  // zapless auth login
  auth
    .command("login")
    .description("Authenticate via browser")
    .action(async () => {
      const { execSync } = require("child_process");

      // 1. Create a pending session on the server
      let sid: string;
      try {
        const res = await axios.post(`${CONFIG.SERVER_URL}/api/zapless/auth/start`);
        sid = res.data.sid;
      } catch {
        console.error("Could not reach server. Check your connection.");
        process.exit(1);
      }

      // 2. Open browser to /connect?sid=...
      const url = `https://zapless.app/connect?sid=${sid}`;
      console.log(`\nOpening browser to authenticate...\n`);
      console.log(`  ${url}\n`);
      try {
        const cmd = process.platform === "darwin" ? "open" : "xdg-open";
        execSync(`${cmd} "${url}"`);
      } catch {}

      // 3. Poll until authorized (10 min timeout)
      const spinner = ora("Waiting for authorization in browser...").start();
      const deadline = Date.now() + 10 * 60 * 1000;

      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 2000));
        try {
          const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/auth/poll/${sid}`);
          if (res.data.status === "authorized") {
            const token = res.data.install_token;
            // 4. Fetch full session info
            const me = await axios.post(`${CONFIG.SERVER_URL}/api/zapless/auth`, { install_token: token });
            saveSession({ install_token: token, connected_apps: me.data.connected_apps, email: me.data.email });
            spinner.succeed("Authenticated!");
            if (me.data.connected_apps.length > 0) {
              console.log(`Connected: ${me.data.connected_apps.map((a: string) => chalk.cyan(a)).join(", ")}`);
            } else {
              console.log(chalk.dim("No apps connected yet. Visit zapless.app/dashboard to connect apps."));
            }
            return;
          }
        } catch (err: any) {
          if (err.response?.status === 410) {
            spinner.fail("Session expired. Run zapless auth login to try again.");
            process.exit(1);
          }
        }
      }

      spinner.fail("Timed out waiting for authorization.");
      process.exit(1);
    });

  // zapless auth logout
  auth
    .command("logout")
    .description("Clear local session")
    .action(() => {
      clearSession();
      console.log(chalk.green("Logged out."));
    });

  // zapless auth status
  auth
    .command("status")
    .description("Show current user and connected apps")
    .action(() => {
      const session = getSession();

      if (!session) {
        console.error("Not authenticated. Run: zapless auth login");
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
