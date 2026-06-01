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
import { getConfig } from "@/core/services/config/find-config.js";

import { validateTree } from "@/core/services/validation/validator.js";
import { getValidationResult } from "@/core/services/validation/get-validation-result.js";
import { TGroupOptions } from "@/types/validation.js";
import { createDefaultConfig } from "@/core/services/config/create-default-config.js";
import { parseConfig } from "@/core/services/config/config-parser.js";

/**
 * Interface representing command-line options for the 'scan' command.
 */
interface IScanOptions {
  treeOutput?: string | boolean;
  annotatedOutput?: string | boolean;
  vitals?: boolean;
  printTree?: boolean;
  groupBy?: TGroupOptions;
  configPath?: string;
}

/**
 * Resolves the absolute path for output files.
 */
const resolveOutPath = (
  val: string | boolean,
  defaultName: string,
  root: string,
) => {
  const fileName = typeof val === "string" && val.length ? val : defaultName;
  return path.resolve(root, fileName);
};

const program = new Command();

program.name("tree-lint").description("Project tree linter").version("0.1.0");

/**
 * 'init' command: Sets up a configuration file in the current project.
 */
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

/**
 * 'scan' command: The core functionality.
 * 1. Loads and parse configuration.
 * 2. Validate paths.
 * 3. Builds a raw tree structure from the filesystem.
 * 4. Annotates the tree (layers, entities, groups).
 * 5. Validates the annotated tree based on rules.
 * 6. Logs results, optionally exports JSON, or displays performance metrics.
 */
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
  .option("-c, --config-path [path]", "Path to configuration file")
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

      // 1 - Load and parse configuration
      const configPath = options.configPath;
      const { config, projectRoot } = await getConfig(configPath);
      const internalConfig = parseConfig(config);

      const resolvedPath = projectPath
        ? path.resolve(projectPath)
        : projectRoot;

      // 2 - Validate paths
      const roots = validateInitialPaths(
        resolvedPath,
        internalConfig.roots,
        internalConfig.ignore,
      );

      logScanPlan(roots, internalConfig.ignore);

      // 3 - Build base project tree
      const tree = await buildProjectTree(roots, internalConfig.ignore);

      // 4 - Tree annotation (layers -> entities -> groups)
      const layeredTree = annotateLayers(tree, internalConfig);
      const { tree: entitiesTree, log: entitiesLog } = annotateEntities(
        layeredTree,
        internalConfig,
      );
      const { tree: annotatedTree, log: groupLog } = annotateGroups(
        entitiesTree,
        internalConfig,
      );

      // 5 - Validation
      const validationLog = validateTree(annotatedTree);

      const workLog = [...entitiesLog, ...groupLog, ...validationLog];

      // Groups validation violations
      const validationResult = getValidationResult(workLog, options.groupBy);

      // 6 - Shows results
      // Optionally shows project tree in console
      if (options.printTree !== undefined)
        annotatedTree.trees.forEach((node: TAnyNode) => printProjectTree(node));

      validationLogger(validationResult);

      // Exporting base tree output
      if (options.treeOutput !== undefined) {
        const out = resolveOutPath(
          options.treeOutput,
          ".project-tree.json",
          resolvedPath,
        );
        await saveToJson(tree, out, resolvedPath);
      }

      // Exporting annotated tree output
      if (options.annotatedOutput !== undefined) {
        const out = resolveOutPath(
          options.annotatedOutput,
          ".entities-tree.json",
          resolvedPath,
        );
        await saveToJson(annotatedTree, out, resolvedPath);
      }

      // Performance reporting
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

      spinner.succeed("Validation complete successfully!");
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
