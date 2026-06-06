#!/usr/bin/env node

import { Command, Option } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";
import prompts, { PromptObject } from "prompts";

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
import {
  createConfig,
  IInitOptions,
} from "@/core/services/config/create-default-config.js";
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

const formatQn: PromptObject<string> = {
  type: "select",
  name: "format",
  message: "What format do you want for the configuration file?",
  choices: [
    {
      title: "TypeScript",
      description: "(Recommended)",
      value: "ts",
    },
    {
      title: "JavaScript",
      value: "js",
    },
    {
      title: "JSON",
      value: "json",
    },
    {
      title: "YAML",
      value: "yaml",
    },
  ],
  initial: 0,
};

const typeQn: PromptObject<string> = {
  type: "select",
  name: "type",
  message: "What type of configuration do you want to create?",
  choices: [
    {
      title: "default",
      description: "A basic configuration with common settings and rules",
      value: "default",
    },
    {
      title: "Deep Tree",
      description: "Configuration for Deep Tree architecture",
      value: "deep-tree",
    },
  ],
  initial: 1,
};

const OPTION_LABELS: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  json: "JSON",
  yaml: "YAML",
  default: "Default",
  "deep-tree": "Deep Tree",
};

const program = new Command();

program.name("tree-lint").description("Project tree linter").version("0.1.0");

/**
 * 'init' command: Sets up a configuration file in the current project.
 * 1. Detects whether the environment is interactive (TTY, non-CI).
 * 2. In non-interactive mode, requires all flags to be explicitly provided.
 * 3. In interactive mode, prompts the user for any missing options.
 * 4. Asks for confirmation before proceeding.
 * 5. Validates that all required options are present.
 * 6. Generates the configuration file in the specified format and type.
 */
program
  .command("init")
  .addOption(
    new Option(
      "-f, --format <format>",
      "Format of the configuration file (ts, js, json, yaml)",
    ).choices(["ts", "js", "json", "yaml"]),
  )
  .addOption(
    new Option(
      "-t, --type <type>",
      "Type of default configuration to create (default, deep-tree)",
    ).choices(["default", "deep-tree"]),
  )
  .description("Initialize a new tree-lint configuration")
  .action(async (options: IInitOptions) => {
    try {
      const isInteractive =
        process.stdout.isTTY &&
        !process.env.CI &&
        process.env.NON_INTERACTIVE !== "true";

      if (!isInteractive && (!options.format || !options.type)) {
        console.error(
          chalk.red(
            "[Init error]: No options provided. In non-interactive environments, all required flags (--format, --type) must be specified.",
          ),
        );

        process.exit(1);
      }

      let isConfirmed = !isInteractive;
      let finalOptions;
      let format = options.format;
      let type = options.type;

      while (!isConfirmed) {
        const questions: PromptObject<string>[] = [
          ...(!format ? [formatQn] : []),
          ...(!type ? [typeQn] : []),
        ];

        const answers = await prompts(questions, {
          onCancel: () => {
            console.log(chalk.cyan("\nOperation cancelled. Bye!"));
            process.exit(0);
          },
        });

        finalOptions = { type, format, ...answers };

        const confirmation = await prompts([
          {
            type: "confirm",
            name: "confirm",
            message: `You are about to create a configuration file with the following settings:
  ${finalOptions.format ? `• Format: ${OPTION_LABELS[finalOptions.format] || finalOptions.format}` : ""}
  ${finalOptions.type ? `• Type: ${OPTION_LABELS[finalOptions.type] || finalOptions.type}` : ""}

Do you want to proceed?`,
            initial: true,
          },
        ]);

        if (confirmation.confirm) {
          isConfirmed = true;
        } else {
          type = undefined;
          format = undefined;
        }
      }

      if (!isInteractive) {
        finalOptions = { format: options.format, type: options.type };
      }

      for (const option in finalOptions) {
        if (!finalOptions[option]) {
          console.error(
            chalk.red(
              `[Init error]: Missing required option: --${option}. Please specify it via flags or interactive prompt`,
            ),
          );
          process.exit(1);
        }
      }

      await createConfig(finalOptions);

      console.log(chalk.green("\nConfiguration file created successfully!"));
      process.exit(0);
    } catch (error) {
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
