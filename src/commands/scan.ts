import { writeSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";

import { parseConfig } from "@/core/services/config/config-parser.js";
import { getConfig } from "@/core/services/config/find-config.js";
import {
  annotateEntities,
  annotateGroups,
  annotateLayers,
  buildProjectTree,
} from "@/core/services/index.js";
import {
  getValidationResult,
  getViolations,
} from "@/core/services/validation/get-validation-result.js";
import { validateTree } from "@/core/services/validation/validator.js";
import type { TAnyNode } from "@/types/nodes.js";
import type { TGroupOptions } from "@/types/validation.js";
import {
  buildValidationReport,
  logScanPlan,
  printProjectTree,
  saveToJson,
  validationLogger,
} from "@/utils/index.js";
import { countNodes, getVitals, printReport } from "@/utils/performance.js";
import { validateInitialPaths } from "@/utils/validate-path.js";

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
  json?: string | boolean;
  failOnError?: boolean;
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

/**
 * 'scan' command: The core functionality.
 * 1. Loads and parse configuration.
 * 2. Validate paths.
 * 3. Builds a raw tree structure from the filesystem.
 * 4. Annotates the tree (layers, entities, groups).
 * 5. Validates the annotated tree based on rules.
 * 6. Logs results, optionally exports JSON, or displays performance metrics.
 */
export const scanCommand = new Command()
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
  .option(
    "--json [file]",
    "Write a machine-readable validation report to stdout or a file (suppresses human-readable output)",
  )
  .option(
    "--no-fail-on-error",
    "Exit with code 0 even when validation errors are found",
  )
  .action(async (projectPath: string = ".", options: IScanOptions) => {
    const jsonMode = options.json !== undefined;
    const spinner = ora({
      text: "Scanning...",
      isSilent: jsonMode,
    }).start();

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

      if (!jsonMode) logScanPlan(roots, internalConfig.ignore);

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
      const violations = getViolations(workLog);
      const validationResult = getValidationResult(workLog, options.groupBy);

      // 6 - Shows results
      if (jsonMode) {
        const report = buildValidationReport(violations, resolvedPath);
        const payload = JSON.stringify(report, null, 2);

        if (typeof options.json === "string" && options.json.length) {
          const out = resolveOutPath(
            options.json,
            "tree-lint-report.json",
            resolvedPath,
          );
          await fs.writeFile(out, payload, "utf-8");
        } else {
          writeSync(1, `${payload}\n`);
        }
      } else {
        // Optionally shows project tree in console
        if (options.printTree !== undefined)
          annotatedTree.trees.forEach((node: TAnyNode) =>
            printProjectTree(node),
          );

        validationLogger(validationResult);
      }

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
      if (!jsonMode && options.vitals !== undefined) {
        const totalNodes = tree.trees.reduce(
          (acc, t) => acc + countNodes(t),
          0,
        );
        printReport(start, totalNodes);
      }

      if (validationResult.errors > 0) {
        if (options.failOnError !== false) {
          spinner.fail(chalk.red(`Validation failed.\n`));
          process.exit(1);
        }

        spinner.warn(
          chalk.yellow(
            `Validation finished with ${validationResult.errors} error(s) (exit code forced to 0).`,
          ),
        );
        process.exit(0);
      }

      spinner.succeed("Validation complete successfully!");
      process.exit(0);
    } catch (error) {
      spinner.fail("Error");

      if (error instanceof Error) {
        if (jsonMode) {
          writeSync(2, `${JSON.stringify({ error: error.message })}\n`);
        } else {
          console.error(chalk.red(error.message));
        }
      }

      process.exit(1);
    }
  });
