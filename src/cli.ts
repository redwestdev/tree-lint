#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";

import {
  printProjectTree,
  saveToJson,
  logScanPlan,
  validationLogger,
} from "@/utils/index.js";
import { TAnyNode } from "@/types/nodes.js";
import {
  annotateEntities,
  annotateGroups,
  annotateLayers,
  buildProjectTree,
} from "@/core/services/index.js";
import { countNodes, getVitals, printReport } from "@/utils/performance.js";
import { validateInitialPaths } from "@/utils/validate-path.js";
import { getConfig } from "@/utils/find-config.js";

import { validateTree } from "@/core/services/validation/validator.js";
import { getValidationResult } from "@/core/services/validation/get-validation-result.js";
import { TGroupOptions } from "@/types/validation.js";
import { createDefaultConfig } from "@/core/services/config/create-default-config.js";

interface IScanOptions {
  treeOutput?: string | boolean;
  annotatedOutput?: string | boolean;
  vitals?: boolean;
  printTree?: boolean;
  groupBy?: TGroupOptions;
}

const resolveOutPath = (
  val: string | boolean,
  defaultName: string,
  root: string,
) => {
  const fileName = typeof val === "string" && val.length ? val : defaultName;
  return path.resolve(root, fileName);
};

const program = new Command();

program
  .name("tree-lint")
  .description("Project tree linter for React")
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new tree-lint configuration")
  .action(async () => {
    // TODO: add options for different configs
    const spinner = ora(`Creating default configuration...`).start();

    try {
      await createDefaultConfig();

      spinner.succeed("Configuration file created successfully!");
      process.exit(0);
    } catch (error) {
      spinner.fail("Error");

      if (error instanceof Error) {
        console.error(chalk.red(error.message));
      }

      process.exit(1);
    }
  });

program
  .command("scan [path]")
  .description("Scan the project and optionally save structure to file")
  .option(
    "-t, --tree-output [file]",
    "Export the raw file system structure to a JSON file",
  )
  .option(
    "-a, --annotated-output [file]",
    "Export the processed tree (with identified layers, entities, and groups) to a JSON file",
  )
  .option(
    "-g, --group-by <type>",
    "Group validation output by: path, severity, or rule (default: path)",
    "path",
  )
  .option(
    "-v, --vitals",
    "Display detailed engine performance metrics (CPU, Memory, and I/O efficiency)",
  )
  .option(
    "-p, --print-tree",
    "Render the analyzed project structure directly in the terminal",
  )
  .action(async (projectPath: string = ".", options: IScanOptions) => {
    const spinner = ora("Scanning...").start();

    try {
      const start = getVitals();

      const { config, projectRoot } = await getConfig();

      // work with config (validation, ...)

      const resolvedPath = projectPath
        ? path.resolve(projectPath)
        : projectRoot;

      const roots = validateInitialPaths(
        resolvedPath,
        config.roots,
        config.ignore,
      );

      logScanPlan(roots, config.ignore);

      const tree = await buildProjectTree(roots, config.ignore);

      const layeredTree = annotateLayers(tree, config);
      const { tree: entitiesTree, log: entitiesLog } = annotateEntities(
        layeredTree,
        config,
      );
      const { tree: annotatedTree, log: groupLog } = annotateGroups(
        entitiesTree,
        config,
      );

      const validationLog = validateTree(annotatedTree);

      if (options.printTree !== undefined)
        annotatedTree.trees.forEach((node: TAnyNode) => printProjectTree(node));

      const workLog = [...entitiesLog, ...groupLog, ...validationLog];

      const validationResult = getValidationResult(workLog, options.groupBy);

      validationLogger(validationResult);

      if (options.treeOutput !== undefined) {
        const out = resolveOutPath(
          options.treeOutput,
          ".project-tree.json",
          resolvedPath,
        );
        await saveToJson(tree, out, resolvedPath);
      }

      if (options.annotatedOutput !== undefined) {
        const out = resolveOutPath(
          options.annotatedOutput,
          ".entities-tree.json",
          resolvedPath,
        );
        await saveToJson(annotatedTree, out, resolvedPath);
      }

      if (options.vitals !== undefined) {
        const totalNodes = tree.trees.reduce(
          (acc, t) => acc + countNodes(t),
          0,
        );
        printReport(start, totalNodes);
      }

      if (validationResult.errors > 0) {
        spinner.fail(chalk.red(`Validation failed.\n`));
        process.exit(1);
      }

      spinner.succeed("Done!");
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
