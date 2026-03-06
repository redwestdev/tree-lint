#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { createJiti } from "jiti";

import { FileSystemScanner } from "./core/file-system-scanner.js";

type TreeLintConfig = {
  roots: string[];
  ignore: string[];
};

const jiti = createJiti(import.meta.url);
const configPath = path.resolve(process.cwd(), "tree-lint.config.ts");

const program = new Command();

program
  .name("tree-lint")
  .description("Project tree linter for React")
  .version("0.1.0")
  .option("-o, --output <file>", "Save the project tree to a JSON file");

program
  .command("scan [path]")
  .description("Scan the project and save structure to file")
  .action(async (projectPath = ".") => {
    const options = program.opts();

    const resolvedPath = path.resolve(projectPath);

    const spinner = ora("Scanning...").start();

    try {
      const startParseTime = Date.now();

      const configModule = (await jiti.import(configPath)) as {
        default: TreeLintConfig;
      };

      const config = configModule.default ?? {};

      console.log(config);

      const rootsToScan = config.roots?.length
        ? config.roots.map((r: string) => path.join(resolvedPath, r))
        : [resolvedPath];

      const fsScanner = new FileSystemScanner({
        roots: rootsToScan,
        ignore: config.ignore,
      });

      fsScanner.logScanPlan();

      const tree = await fsScanner.scan();

      if (options.output !== undefined) {
        const outputPath =
          typeof options.output === "string"
            ? path.resolve(resolvedPath, options.output)
            : path.join(resolvedPath, ".project-tree.json");

        await fsScanner.saveTreeToJson(tree, outputPath);
      }

      const duration = Date.now() - startParseTime;

      spinner.succeed(`Structure parsed successfully (${duration}ms)`);

      process.exit(0);
    } catch (error) {
      spinner.fail("Error");

      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }

      process.exit(1);
    }
  });

program.parse(process.argv);
