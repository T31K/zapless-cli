#!/usr/bin/env bun

import { program } from "commander";
import { registerAuth } from "./commands/auth";
import { registerGmail } from "./commands/gmail";

const VERSION = "0.1.0";

program
  .name("clawnect")
  .description("Give your OpenClaw agent superpowers")
  .version(VERSION, "-v, --version", "Show version");

registerAuth(program);
registerGmail(program);

program.parse();
