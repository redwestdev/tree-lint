#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import { createJiti } from "jiti";

import { ITreeLintConfig } from "@/types/config.js";
import {
  EntitiesParser,
  FileSystemScanner,
  LayerParser,
} from "@/core/services/index.js";
import { printProjectTree, saveToJson } from "@/utils/index.js";
import { TAnyNode } from "@/types/nodes.js";

interface IScanOptions {
  treeOutput?: string | boolean;
  annotatedOutput?: string | boolean;
}

const jiti = createJiti(import.meta.url);
const configPath = path.resolve(process.cwd(), "tree-lint.config.ts");

const program = new Command();

program
  .name("tree-lint")
  .description("Project tree linter for React")
  .version("0.1.0");

program
  .command("scan [path]")
  .description("Scan the project and save structure to file")
  .option(
    "-t, --tree-output [file]",
    "Optionally save the project tree to a JSON file",
  )
  .option(
    "-a, --annotated-output [file]",
    "Optionally save the project tree enriched with layers and entities to a JSON file",
  )
  .action(async (projectPath: string | undefined, options: IScanOptions) => {
    const resolvedPath = path.resolve(projectPath || ".");

    const spinner = ora("Scanning...").start();

    try {
      const startParseTime = Date.now();

      const configModule = await jiti.import(configPath);

      if (
        !configModule ||
        typeof configModule !== "object" ||
        !("default" in configModule)
      ) {
        spinner.fail(`File ${configPath} doesn't export default config`);
        process.exit(1);
      }

      const config = configModule.default as ITreeLintConfig;

      const rootsToScan = config.roots?.length
        ? config.roots.map((r: string) => path.join(resolvedPath, r))
        : [resolvedPath];

      const fsScanner = new FileSystemScanner({
        roots: rootsToScan,
        ignore: config.ignore,
        cwd: resolvedPath,
      });

      fsScanner.logScanPlan();

      const tree = await fsScanner.scan();

      const layerParser = new LayerParser(config, tree);
      const layeredTree = layerParser.parse();

      const entitiesParser = new EntitiesParser(config, layeredTree);
      const annotatedTree = entitiesParser.parse();

      annotatedTree.trees.forEach((tree: TAnyNode) => printProjectTree(tree));

      if (options.treeOutput !== undefined) {
        const outputPath =
          typeof options.treeOutput === "string"
            ? path.resolve(resolvedPath, options.treeOutput)
            : path.join(resolvedPath, ".project-tree.json");

        await saveToJson(tree, outputPath);
      }

      if (options.annotatedOutput !== undefined) {
        const entitiesOutputPath =
          typeof options.annotatedOutput === "string"
            ? path.resolve(resolvedPath, options.annotatedOutput)
            : path.join(resolvedPath, ".entities-tree.json");

        await saveToJson(annotatedTree, entitiesOutputPath);
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
