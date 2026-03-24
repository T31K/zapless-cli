#!/usr/bin/env bun

import { program } from "commander";
import { registerAuth } from "./commands/auth";
import { registerGmail } from "./commands/gmail";
import { registerDoctor } from "./commands/doctor";
import { registerSkill } from "./commands/skill";
import { registerApps } from "./commands/apps";
import { registerCalendar } from "./commands/calendar";
import { registerDrive } from "./commands/drive";
import { registerDocs } from "./commands/docs";
import { registerSheets } from "./commands/sheets";
import { registerSlides } from "./commands/slides";
import { registerMeet } from "./commands/meet";
import { registerGithub } from "./commands/github";
import { registerSlack } from "./commands/slack";
import { registerNotion } from "./commands/notion";
import { registerUpdate } from "./commands/update";

const VERSION = "0.3.1";

program
  .name("zapless")
  .description(
    "Zapless — Give your OpenClaw agent access to Gmail and more.\n\n" +
    "Commands:\n" +
    "  auth login --token <token>   Authenticate with your install token\n" +
    "  auth logout                  Clear local session\n" +
    "  auth status                  Show current user and connected apps\n" +
    "  gmail send                   Send an email\n" +
    "  gmail read                   Read inbox\n" +
    "  gmail search                 Search emails\n" +
    "  gmail get --id <id>          Get full body of a specific email\n" +
    "  gmail reply --id <id>        Reply to an email\n" +
    "  gmail forward --id <id>      Forward an email\n" +
    "  gmail trash --id <id>        Move email to trash\n" +
    "  gmail mark --id <id>         Mark email as read or unread\n" +
    "  gmail labels                 List all Gmail labels\n" +
    "  gmail draft create           Create a draft email\n" +
    "  gmail draft send --id <id>   Send a draft\n" +
    "  doctor                       Check session, server, and auth status\n\n" +
    "Run zapless <command> --help for usage details."
  )
  .version(VERSION, "-v, --version", "Show version");

registerAuth(program);
registerGmail(program);
registerDoctor(program);
registerSkill(program);
registerApps(program);
registerCalendar(program);
registerDrive(program);
registerDocs(program);
registerSheets(program);
registerSlides(program);
registerMeet(program);
registerGithub(program);
registerSlack(program);
registerNotion(program);
registerUpdate(program);

program.parse();
