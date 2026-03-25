import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { readFileSync, writeFileSync } from "fs";
import { CONFIG } from "../config";
import { requireSession } from "../session";

function authHeaders(token: string) {
  return { "x-install-token": token };
}

export function registerDrive(program: Command) {
  const drive = program
    .command("drive")
    .description("Interact with the user's Google Drive");

  drive
    .command("commands")
    .description("List all available Drive commands")
    .action(() => {
      console.log(`
Drive commands:

  zapless drive list [--limit <n>]
  zapless drive list --query "<query>"
  zapless drive get --id <file-id>
  zapless drive upload --file <path>
  zapless drive upload --file <path> --folder <folder-id>
  zapless drive download --id <file-id> --out <path>
  zapless drive share --id <file-id> --email <email> --role viewer|editor
  zapless drive delete --id <file-id>
`);
    });

  // list
  drive
    .command("list")
    .description("List files in Google Drive")
    .option("--limit <n>", "Number of files", "20")
    .option("--query <q>", "Drive query (e.g. \"name contains 'report'\")")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching files...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/drive/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit, query: opts.query },
        });
        spinner.stop();
        const { files } = res.data;
        if (files.length === 0) {
          console.log(chalk.yellow("No files found."));
          return;
        }
        files.forEach((f: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${f.name}`));
          console.log(`    Type:     ${chalk.dim(f.mimeType)}`);
          console.log(`    Modified: ${chalk.dim(f.modifiedTime)}`);
          console.log(`    ID:       ${chalk.dim(f.id)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list files");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // get
  drive
    .command("get")
    .description("Get metadata for a specific file")
    .requiredOption("--id <file-id>", "File ID")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching file...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/drive/get`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id },
        });
        spinner.stop();
        const f = res.data;
        console.log(chalk.bold(`\n${f.name}`));
        console.log(`Type:     ${chalk.dim(f.mimeType)}`);
        console.log(`Size:     ${f.size ? `${Math.round(Number(f.size) / 1024)} KB` : "N/A"}`);
        console.log(`Modified: ${chalk.dim(f.modifiedTime)}`);
        if (f.webViewLink) console.log(`Link:     ${chalk.blue(f.webViewLink)}`);
        console.log(`ID:       ${chalk.dim(f.id)}`);
      } catch (err: any) {
        spinner.fail("Failed to get file");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // upload
  drive
    .command("upload")
    .description("Upload a file to Google Drive")
    .requiredOption("--file <path>", "Path to file to upload")
    .option("--folder <folder-id>", "Folder ID to upload into")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora(`Uploading ${opts.file}...`).start();
      try {
        const fileContent = readFileSync(opts.file);
        const fileName = opts.file.split("/").pop();
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/drive/upload`,
          { fileName, fileContent: fileContent.toString("base64"), folderId: opts.folder },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Uploaded — ID: ${chalk.cyan(res.data.id)}`));
      } catch (err: any) {
        spinner.fail("Failed to upload file");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // download
  drive
    .command("download")
    .description("Download a file from Google Drive")
    .requiredOption("--id <file-id>", "File ID")
    .requiredOption("--out <path>", "Output file path")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Downloading...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/drive/download`, {
          headers: authHeaders(session.install_token),
          params: { id: opts.id },
          responseType: "arraybuffer",
        });
        writeFileSync(opts.out, Buffer.from(res.data));
        spinner.succeed(chalk.green(`Downloaded to ${opts.out}`));
      } catch (err: any) {
        spinner.fail("Failed to download file");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // share
  drive
    .command("share")
    .description("Share a file with another user")
    .requiredOption("--id <file-id>", "File ID")
    .requiredOption("--email <email>", "Email to share with")
    .option("--role <role>", "Permission role: viewer, commenter, editor", "viewer")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora(`Sharing with ${opts.email}...`).start();
      try {
        await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/drive/share`,
          { id: opts.id, email: opts.email, role: opts.role },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green(`Shared with ${opts.email} as ${opts.role}`));
      } catch (err: any) {
        spinner.fail("Failed to share file");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // delete
  drive
    .command("delete")
    .description("Delete a file from Google Drive")
    .requiredOption("--id <file-id>", "File ID")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Deleting file...").start();
      try {
        await axios.delete(`${CONFIG.SERVER_URL}/api/zapless/drive/delete`, {
          headers: authHeaders(session.install_token),
          data: { id: opts.id },
        });
        spinner.succeed(chalk.green("File deleted"));
      } catch (err: any) {
        spinner.fail("Failed to delete file");
        console.error(`${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });
}
