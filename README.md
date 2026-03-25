# zapless-cli

> CLI for [Zapless](https://zapless.com) — give your AI agent access to Gmail, GitHub, Slack, Notion and more.

## Install

```bash
npm install -g zapless
```

Or via the installer:

```bash
curl -fsSL https://api.t31k.cloud/api/zapless/install.sh | sh
```

## Setup

Get your install token from [zapless.com/dashboard](https://zapless.com/dashboard), then:

```bash
zapless auth login --token <your-token>
```

## Commands

### Auth
```bash
zapless auth login --token <token>   # Authenticate
zapless auth logout                  # Clear session
zapless auth status                  # Show current user + connected apps
```

### Gmail
```bash
zapless gmail read [--limit 10] [--unread]
zapless gmail search --query <query>
zapless gmail get --id <message-id>
zapless gmail send --to <email> --subject <subject> --body <text>
zapless gmail reply --id <message-id> --body <text>
zapless gmail forward --id <message-id> --to <email>
zapless gmail trash --id <message-id>
zapless gmail mark --id <message-id> --read|--unread
zapless gmail labels
zapless gmail draft create --to <email> --subject <subject> --body <text>
zapless gmail draft send --id <draft-id>
```

### Google Calendar
```bash
zapless calendar list [--limit 10] [--from <date> --to <date>]
zapless calendar get --id <event-id>
zapless calendar create --title "<title>" --start "<datetime>" --end "<datetime>"
zapless calendar update --id <event-id> --title "<title>"
zapless calendar delete --id <event-id>
```

### Google Drive
```bash
zapless drive list [--limit 20] [--query "<query>"]
zapless drive get --id <file-id>
zapless drive upload --file <path>
zapless drive download --id <file-id> --out <path>
zapless drive share --id <file-id> --email <email> --role viewer|editor
zapless drive delete --id <file-id>
```

### Google Docs
```bash
zapless docs list [--limit 20]
zapless docs get --id <doc-id>
zapless docs create --title "<title>"
zapless docs append --id <doc-id> --text "<text>"
```

### Google Sheets
```bash
zapless sheets list [--limit 20]
zapless sheets get --id <sheet-id>
zapless sheets read --id <sheet-id> --range <range>
zapless sheets create --title "<title>"
zapless sheets write --id <sheet-id> --range <range> --values "<rows>"
zapless sheets append --id <sheet-id> --range <range> --values "<rows>"
```

### Google Slides
```bash
zapless slides list [--limit 20]
zapless slides get --id <presentation-id>
zapless slides create --title "<title>"
```

### Google Meet
```bash
zapless meet list [--limit 10]
zapless meet get --id <event-id>
zapless meet create --title "<title>" --start "<datetime>" --end "<datetime>" [--attendees <email1,email2>]
```

### GitHub
```bash
zapless github repos list [--limit 20] [--visibility public|private|all]
zapless github repos get --owner <owner> --repo <repo>
zapless github issues list --owner <owner> --repo <repo> [--state open|closed]
zapless github issues create --owner <owner> --repo <repo> --title "<title>" [--body "<body>"]
zapless github prs list --owner <owner> --repo <repo> [--state open|closed]
zapless github prs create --owner <owner> --repo <repo> --title "<title>" --head <branch> --base <branch>
```

### Slack
```bash
zapless slack channels list [--limit 50]
zapless slack messages send --channel <channel-id-or-name> --text "<text>"
zapless slack members list [--limit 50]
```

### Notion
```bash
zapless notion pages list [--limit 20]
zapless notion pages get --id <page-id>
zapless notion pages create --title "<title>" --parent <page-id> [--content "<text>"]
zapless notion databases list [--limit 20]
zapless notion databases query --id <database-id> [--limit 20]
```

### Utilities
```bash
zapless apps list           # List connected apps
zapless skill               # Print skill instructions for connected apps
zapless doctor              # Diagnose connection + auth issues
zapless update              # Update CLI to latest version
```

## How It Works

The CLI has zero secrets. It holds only your `install_token` locally (`~/.zapless/session.json`). All API calls are proxied through the Zapless server, which holds your encrypted OAuth tokens and calls the relevant APIs on your behalf.

- OAuth lives on the server, never in the CLI
- Tokens are AES-256-GCM encrypted at rest
- If the CLI is compromised, the attacker only gets an install token

## Using with Claude Code

Install the [zapless-plugin](https://github.com/T31K/zapless-plugin) to automatically inject Zapless context into every Claude Code session:

```bash
claude plugin install zapless@T31K/zapless-plugin
```

## License

MIT
