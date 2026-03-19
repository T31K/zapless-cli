import { homedir } from "os";
import { join } from "path";

export const CONFIG = {
  SERVER_URL: process.env.CLAWNECT_SERVER ?? "ZAPLESS_SERVER_URL",
  SESSION_DIR: join(homedir(), ".clawnect"),
  SESSION_FILE: join(homedir(), ".clawnect", "session.json"),
};

export interface Session {
  install_token: string;
  connected_apps: string[];
  email?: string;
}
