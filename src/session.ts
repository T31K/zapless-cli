import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { CONFIG, type Session } from "./config";

export function getSession(): Session | null {
  if (!existsSync(CONFIG.SESSION_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG.SESSION_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  if (!existsSync(CONFIG.SESSION_DIR)) {
    mkdirSync(CONFIG.SESSION_DIR, { recursive: true });
  }
  writeFileSync(CONFIG.SESSION_FILE, JSON.stringify(session, null, 2));
}

export function clearSession(): void {
  if (existsSync(CONFIG.SESSION_FILE)) {
    rmSync(CONFIG.SESSION_FILE);
  }
}

export function requireSession(): Session {
  const session = getSession();
  if (!session) {
    console.error("❌ Not authenticated. Run: clawnect auth login --token <your_install_token>");
    process.exit(1);
  }
  return session;
}
