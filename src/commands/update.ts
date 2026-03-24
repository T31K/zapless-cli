import { execSync } from "child_process";
import chalk from "chalk";
import ora from "ora";
import { CONFIG } from "../config";

export function registerUpdate(program: any) {
  program
    .command("update")
    .description("Update zapless CLI to the latest version")
    .action(async () => {
      const spinner = ora("Fetching latest version...").start();
      try {
        spinner.text = "Downloading and installing latest zapless...";
        execSync(`curl -fsSL ${CONFIG.SERVER_URL}/api/zapless/install.sh | sh`, { stdio: "pipe" });
        spinner.succeed(chalk.green("zapless updated successfully"));
        console.log(chalk.dim("Restart your terminal if the version hasn't changed."));
      } catch (err: any) {
        spinner.fail(chalk.red("Update failed"));
        console.error(chalk.dim(err.message));
        process.exit(1);
      }
    });
}
