import { pathToFileURL } from "node:url";

import chalk from "chalk";

import type {
  TGroupedByPath,
  TGroupedByRule,
  TGroupedBySeverity,
  TValidationStats,
} from "@/types/validation.js";

const styles = {
  error: chalk.red,
  warning: chalk.yellow,
  message: chalk.white,
  rule: chalk.white.bold,
  indent: "  ",
};

function createPath(absolutePath: string): string {
  try {
    const fileUrl = pathToFileURL(absolutePath).href;

    return `\u001b]8;;${fileUrl}\u0007${absolutePath}\u001b]8;;\u0007`;
  } catch (_e) {
    return absolutePath;
  }
}

function logByPath(data: TGroupedByPath) {
  for (const path in data) {
    const { warning, error } = data[path];

    if (!warning.length && !error.length) continue;

    console.log(`\n${createPath(path)}`);

    if (warning.length)
      warning.forEach((w) => {
        console.warn(`${styles.indent}${styles.warning(`⚠ ${w}`)}`);
      });

    if (error.length)
      error.forEach((e) => {
        console.error(`${styles.indent}${styles.error(`✖ ${e}`)}`);
      });
  }
}

function logBySeverity(data: TGroupedBySeverity) {
  if (data.error.length) {
    console.log(styles.error("✖ ERRORS:"));
    for (const e of data.error) {
      console.log(
        `${styles.indent}${styles.error(e.message)} - ${createPath(e.path)}`,
      );
    }
  }

  if (data.warning.length) {
    console.log(styles.warning("\n⚠ WARNINGS:"));
    for (const w of data.warning) {
      console.log(
        `${styles.indent}${styles.warning(w.message)} - ${createPath(w.path)}`,
      );
    }
  }
}

function logByRule(data: TGroupedByRule) {
  for (const rule in data) {
    console.log(`\n${styles.rule(rule)}`);
    if (data[rule].error.size) {
      data[rule].error.forEach((e) =>
        console.log(`${styles.indent}${styles.error(`✖ ${createPath(e)}`)}`),
      );
    }
    if (data[rule].warning.size) {
      data[rule].warning.forEach((e) =>
        console.log(`${styles.indent}${styles.warning(`⚠ ${createPath(e)}`)}`),
      );
    }
  }
}

export function validationLogger(log: TValidationStats) {
  switch (log.type) {
    case "rule":
      logByRule(log.grouped);
      break;
    case "severity":
      logBySeverity(log.grouped);
      break;
    case "path":
      logByPath(log.grouped);
      break;
    default:
      break;
  }

  console.log(
    chalk.bold(
      `\nErrors: ${chalk.red(log.errors)}, warnings: ${chalk.yellow(log.warnings)}.\n`,
    ),
  );
}
