import { homedir } from "os";
import { join } from "path";

export const CONFIG = {
  SERVER_URL: process.env.CLAWNECT_SERVER ?? "https://api.t31k.cloud",
  SESSION_DIR: join(homedir(), ".clawnect"),
  SESSION_FILE: join(homedir(), ".clawnect", "session.json"),
};

export interface Session {
  install_token: string;
  connected_apps: string[];
  email?: string;
}
