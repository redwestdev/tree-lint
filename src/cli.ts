#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { cosmiconfig } from "cosmiconfig";

import { FileSystemScanner } from "./core/file-system-scaner";

const explorer = cosmiconfig("structure-lint");

const program = new Command();

program
  .name("structure-lint")
  .description("Deep Tree structure linter for React")
  .version("0.1.0");

program
  .command("scan [path]")
  .description("Scan the project and save structure to file")
  .action(async (projectPath = ".") => {
    const resolvedPath = path.resolve(projectPath);

    const spinner = ora("Scanning...").start();

    try {
      const startTime = Date.now();

      const projectRoot = process.cwd();
      const result = await explorer.search(projectRoot);

      const config = result?.config ?? {};

      const rootsToScan = config.roots?.length
        ? config.roots.map((r: string) => path.join(resolvedPath, r))
        : [resolvedPath];

      const fsScanner = new FileSystemScanner({
        roots: rootsToScan,
        ignore: config.ignore,
      });

      fsScanner.logScanPlan();

      await fsScanner.saveTreeToJson(
        path.join(resolvedPath, ".project-tree.json"),
      );

      const duration = Date.now() - startTime;

      spinner.succeed(`Structure saved successfully (${duration}ms)`);

      process.exit(0);
    } catch (error) {
      spinner.fail("Error");

      if (error instanceof Error) {
        console.error(chalk.red("\n✗ Error:"), error.message);
      }

      process.exit(1);
    }
  });

program.parse();
