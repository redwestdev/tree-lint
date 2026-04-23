#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import path from "path";

import { printProjectTree, saveToJson, logScanPlan } from "@/utils/index.js";
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
import { validateNodes } from "@/core/services/validator.js";

interface IScanOptions {
  treeOutput?: string | boolean;
  annotatedOutput?: string | boolean;
  vitals?: boolean;
  printTree?: boolean;
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
  .command("scan [path]")
  .description("Scan the project and save structure to file")
  .option(
    "-t, --tree-output [file]",
    "Export the raw file system structure to a JSON file",
  )
  .option(
    "-a, --annotated-output [file]",
    "Export the processed tree (with identified layers, entities, and groups) to a JSON file",
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
      const entitiesTree = annotateEntities(layeredTree, config);
      const annotatedTree = annotateGroups(entitiesTree, config);

      if (options.printTree)
        annotatedTree.trees.forEach((node: TAnyNode) => printProjectTree(node));

      annotatedTree.trees.forEach((node: TAnyNode) => validateNodes(node));

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
