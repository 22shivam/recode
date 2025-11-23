#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { install } from "../lib/installer.js";

const program = new Command();

program
  .name("create-recode")
  .description("Add self-healing AI to any Convex app")
  .version("0.1.0");

program
  .command("init")
  .description("Install ReCode into your Convex project")
  .option("-y, --yes", "Skip all prompts and use defaults", false)
  .option("--no-omi", "Skip Omi integration setup", false)
  .action(async (options) => {
    console.log(chalk.bold.cyan("\n🤖 ReCode Installer\n"));
    console.log(chalk.gray("Adding self-healing AI to your Convex app...\n"));

    try {
      await install(options);
    } catch (error) {
      console.error(chalk.red("\n❌ Installation failed:"), error.message);
      process.exit(1);
    }
  });

program.parse();
