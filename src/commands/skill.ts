import { Command } from "commander";
import axios from "axios";
import { CONFIG } from "../config";
import { requireSession } from "../session";

export function registerSkill(program: Command) {
  program
    .command("skill [app]")
    .description("Fetch the skill .md for a specific app or all connected apps")
    .action(async (app?: string) => {
      const session = requireSession();

      try {
        const url = app
          ? `${CONFIG.SERVER_URL}/api/clawnect/skill/${app}`
          : `${CONFIG.SERVER_URL}/api/clawnect/skill`;

        const res = await axios.get(url, {
          params: { token: session.install_token },
        });

        process.stdout.write(res.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          const msg = app
            ? `App "${app}" not connected or no skill doc available.`
            : `Token not found. Run: clawnect auth login --token <your_install_token>`;
          console.error(`❌ ${msg}`);
        } else {
          console.error(`❌ ${err.response?.data ?? err.message}`);
        }
        process.exit(1);
      }
    });
}
