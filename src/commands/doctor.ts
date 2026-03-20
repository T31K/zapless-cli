import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import { CONFIG } from "../config";
import { getSession } from "../session";
import { existsSync } from "fs";

export function registerDoctor(program: Command) {
  program
    .command("doctor")
    .description("Check session, server reachability, and auth status")
    .action(async () => {
      console.log(chalk.bold("\nClawnect Doctor\n"));

      let allGood = true;

      // 1. Session file exists
      const sessionExists = existsSync(CONFIG.SESSION_FILE);
      if (sessionExists) {
        console.log(chalk.green("✔") + "  Session file found");
      } else {
        console.log(chalk.red("✘") + "  No session file — run: clawnect auth login --token <token>");
        allGood = false;
      }

      // 2. Session is valid JSON with token
      const session = getSession();
      if (session?.install_token) {
        console.log(chalk.green("✔") + "  Session is valid");
        if (session.email) {
          console.log(chalk.green("✔") + `  Logged in as ${chalk.cyan(session.email)}`);
        }
      } else if (sessionExists) {
        console.log(chalk.red("✘") + "  Session file is corrupt — run: clawnect auth login --token <token>");
        allGood = false;
      }

      // 3. Server reachable
      try {
        await axios.get(`${CONFIG.SERVER_URL}/api/clawnect/health`, { timeout: 5000 });
        console.log(chalk.green("✔") + `  Server reachable (${CONFIG.SERVER_URL})`);
      } catch {
        try {
          // fallback: hit any known endpoint
          await axios.post(`${CONFIG.SERVER_URL}/api/clawnect/auth`, {}, { timeout: 5000 });
        } catch (err: any) {
          if (err.response) {
            // got a response = server is up
            console.log(chalk.green("✔") + `  Server reachable (${CONFIG.SERVER_URL})`);
          } else {
            console.log(chalk.red("✘") + `  Server unreachable (${CONFIG.SERVER_URL})`);
            allGood = false;
          }
        }
      }

      // 4. Auth valid (only if session exists)
      if (session?.install_token) {
        try {
          const res = await axios.post(`${CONFIG.SERVER_URL}/api/clawnect/auth`, {
            install_token: session.install_token,
          }, { timeout: 5000 });

          const { connected_apps } = res.data;
          console.log(chalk.green("✔") + "  Auth token valid");

          if (connected_apps.length > 0) {
            console.log(chalk.green("✔") + `  Connected apps: ${connected_apps.map((a: string) => chalk.cyan(a)).join(", ")}`);
          } else {
            console.log(chalk.yellow("⚠") + "  No apps connected — visit clawnect.app/dashboard");
          }
        } catch (err: any) {
          if (err.response?.status === 401) {
            console.log(chalk.red("✘") + "  Auth token invalid — re-run: clawnect auth login --token <token>");
          } else {
            console.log(chalk.yellow("⚠") + "  Could not verify token (server may be down)");
          }
          allGood = false;
        }
      }

      console.log();
      if (allGood) {
        console.log(chalk.green("Everything looks good!"));
      } else {
        console.log(chalk.red("Issues found — see above."));
        process.exit(1);
      }
      console.log();
    });
}
