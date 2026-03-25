import { Command } from "commander";
import axios from "axios";
import { CONFIG } from "../config";
import { requireSession } from "../session";

export function registerSkill(program: Command) {
  program
    .command("skill [app]")
    .description("Fetch the skill .md for a specific app or all connected apps")
    .option("--plugin", "Plugin mode — strips Setup section (passes ?mode=plugin to server)")
    .action(async (app: string | undefined, opts: { plugin?: boolean }) => {
      const session = requireSession();

      try {
        const url = app
          ? `${CONFIG.SERVER_URL}/api/zapless/skill/${app}`
          : `${CONFIG.SERVER_URL}/api/zapless/skill`;

        const res = await axios.get(url, {
          params: {
            token: session.install_token,
            ...(opts.plugin && { mode: "plugin" }),
          },
        });

        process.stdout.write(res.data);
      } catch (err: any) {
        if (err.response?.status === 404) {
          const msg = app
            ? `App "${app}" not connected or no skill doc available.`
            : `Token not found. Run: zapless auth login --token <your_install_token>`;
          console.error(`❌ ${msg}`);
        } else {
          console.error(`❌ ${err.response?.data ?? err.message}`);
        }
        process.exit(1);
      }
    });
}
