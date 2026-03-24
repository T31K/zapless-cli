import { Command } from "commander";
import axios from "axios";
import chalk from "chalk";
import ora from "ora";
import { CONFIG } from "../config";
import { requireSession } from "../session";

function authHeaders(token: string) {
  return { "x-install-token": token };
}

export function registerGithub(program: Command) {
  const github = program
    .command("github")
    .description("Interact with GitHub repositories");

  github
    .command("commands")
    .description("List all available GitHub commands")
    .action(() => {
      console.log(`
GitHub commands:

  zapless github repos list [--limit <n>] [--visibility public|private|all]
  zapless github repos get --owner <owner> --repo <repo>
  zapless github issues list --owner <owner> --repo <repo> [--state open|closed] [--limit <n>]
  zapless github issues create --owner <owner> --repo <repo> --title "<title>" [--body "<body>"] [--labels <label1,label2>]
  zapless github prs list --owner <owner> --repo <repo> [--state open|closed] [--limit <n>]
  zapless github prs create --owner <owner> --repo <repo> --title "<title>" --head <branch> --base <branch> [--body "<body>"]
`);
    });

  // ── repos ──────────────────────────────────────────────────────────────────

  const repos = github.command("repos").description("Manage GitHub repositories");

  repos
    .command("list")
    .description("List GitHub repositories")
    .option("--limit <n>", "Number of repos", "20")
    .option("--visibility <v>", "public, private, or all", "all")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching repos...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/github/repos/list`, {
          headers: authHeaders(session.install_token),
          params: { limit: opts.limit, visibility: opts.visibility },
        });
        spinner.stop();
        const { repos } = res.data;
        if (repos.length === 0) {
          console.log(chalk.yellow("No repositories found."));
          return;
        }
        repos.forEach((r: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] ${r.full_name}`));
          if (r.description) console.log(`    ${chalk.dim(r.description)}`);
          const vis = r.private ? chalk.red("private") : chalk.green("public");
          const lang = r.language ? ` · ${chalk.cyan(r.language)}` : "";
          console.log(`    ${vis}${lang} · ⭐ ${r.stars}`);
          console.log(`    Updated: ${chalk.dim(r.updated_at)}`);
          console.log(`    URL:     ${chalk.blue(r.url)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list repos");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  repos
    .command("get")
    .description("Get details of a repository")
    .requiredOption("--owner <owner>", "Repository owner")
    .requiredOption("--repo <repo>", "Repository name")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching repo...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/github/repos/get`, {
          headers: authHeaders(session.install_token),
          params: { owner: opts.owner, repo: opts.repo },
        });
        spinner.stop();
        const r = res.data;
        console.log(chalk.bold(`\n${r.full_name}`));
        if (r.description) console.log(chalk.dim(r.description));
        console.log(`Visibility:  ${r.private ? chalk.red("private") : chalk.green("public")}`);
        if (r.language) console.log(`Language:    ${chalk.cyan(r.language)}`);
        console.log(`Stars:       ${r.stars}`);
        console.log(`Forks:       ${r.forks}`);
        console.log(`Open issues: ${r.open_issues}`);
        console.log(`Branch:      ${chalk.dim(r.default_branch)}`);
        console.log(`URL:         ${chalk.blue(r.url)}`);
      } catch (err: any) {
        spinner.fail("Failed to get repo");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // ── issues ─────────────────────────────────────────────────────────────────

  const issues = github.command("issues").description("Manage GitHub issues");

  issues
    .command("list")
    .description("List issues in a repository")
    .requiredOption("--owner <owner>", "Repository owner")
    .requiredOption("--repo <repo>", "Repository name")
    .option("--state <state>", "open or closed", "open")
    .option("--limit <n>", "Number of issues", "20")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching issues...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/github/issues/list`, {
          headers: authHeaders(session.install_token),
          params: { owner: opts.owner, repo: opts.repo, state: opts.state, limit: opts.limit },
        });
        spinner.stop();
        const { issues } = res.data;
        if (issues.length === 0) {
          console.log(chalk.yellow("No issues found."));
          return;
        }
        issues.forEach((issue: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] #${issue.number} ${issue.title}`));
          const stateColor = issue.state === "open" ? chalk.green(issue.state) : chalk.dim(issue.state);
          console.log(`    State:  ${stateColor}`);
          if (issue.labels.length) console.log(`    Labels: ${chalk.cyan(issue.labels.join(", "))}`);
          console.log(`    URL:    ${chalk.blue(issue.url)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list issues");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  issues
    .command("create")
    .description("Create a GitHub issue")
    .requiredOption("--owner <owner>", "Repository owner")
    .requiredOption("--repo <repo>", "Repository name")
    .requiredOption("--title <title>", "Issue title")
    .option("--body <body>", "Issue body")
    .option("--labels <labels>", "Comma-separated labels")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Creating issue...").start();
      try {
        const labels = opts.labels ? opts.labels.split(",").map((l: string) => l.trim()) : [];
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/github/issues/create`,
          { owner: opts.owner, repo: opts.repo, title: opts.title, body: opts.body, labels },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green("Issue created!"));
        console.log(`Issue #${res.data.number}: ${chalk.blue(res.data.url)}`);
      } catch (err: any) {
        spinner.fail("Failed to create issue");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  // ── prs ────────────────────────────────────────────────────────────────────

  const prs = github.command("prs").description("Manage GitHub pull requests");

  prs
    .command("list")
    .description("List pull requests in a repository")
    .requiredOption("--owner <owner>", "Repository owner")
    .requiredOption("--repo <repo>", "Repository name")
    .option("--state <state>", "open or closed", "open")
    .option("--limit <n>", "Number of PRs", "20")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Fetching pull requests...").start();
      try {
        const res = await axios.get(`${CONFIG.SERVER_URL}/api/zapless/github/prs/list`, {
          headers: authHeaders(session.install_token),
          params: { owner: opts.owner, repo: opts.repo, state: opts.state, limit: opts.limit },
        });
        spinner.stop();
        const { prs } = res.data;
        if (prs.length === 0) {
          console.log(chalk.yellow("No pull requests found."));
          return;
        }
        prs.forEach((pr: any, i: number) => {
          console.log(chalk.bold(`\n[${i + 1}] #${pr.number} ${pr.title}`));
          console.log(`    ${chalk.dim(pr.head)} → ${chalk.dim(pr.base)}`);
          const stateColor = pr.state === "open" ? chalk.green(pr.state) : chalk.dim(pr.state);
          console.log(`    State: ${stateColor}`);
          console.log(`    URL:   ${chalk.blue(pr.url)}`);
        });
      } catch (err: any) {
        spinner.fail("Failed to list PRs");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });

  prs
    .command("create")
    .description("Create a GitHub pull request")
    .requiredOption("--owner <owner>", "Repository owner")
    .requiredOption("--repo <repo>", "Repository name")
    .requiredOption("--title <title>", "PR title")
    .requiredOption("--head <branch>", "Source branch")
    .requiredOption("--base <branch>", "Target branch")
    .option("--body <body>", "PR description")
    .action(async (opts) => {
      const session = requireSession();
      const spinner = ora("Creating pull request...").start();
      try {
        const res = await axios.post(
          `${CONFIG.SERVER_URL}/api/zapless/github/prs/create`,
          { owner: opts.owner, repo: opts.repo, title: opts.title, body: opts.body, head: opts.head, base: opts.base },
          { headers: authHeaders(session.install_token) }
        );
        spinner.succeed(chalk.green("Pull request created!"));
        console.log(`PR #${res.data.number}: ${chalk.blue(res.data.url)}`);
      } catch (err: any) {
        spinner.fail("Failed to create PR");
        console.error(`❌ ${err.response?.data?.error ?? err.message}`);
        process.exit(1);
      }
    });
}
