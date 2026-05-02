import chalk from "chalk";
import { pathToFileURL } from "node:url";

const styles = {
  error: chalk.red.bold,
  warning: chalk.yellow.bold,
  message: chalk.white,
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

export function validationLogger(
  path: string,
  warnings: string[] = [],
  errors: string[] = [],
) {
  console.log(`\n${createPath(path)}`);

  if (warnings.length)
    warnings.forEach((w) => {
      console.warn(`${styles.indent}${styles.warning("⚠ " + w)}`);
    });

  if (errors.length)
    errors.forEach((e) => {
      console.error(`${styles.indent}${styles.error("✖ " + e)}`);
    });
}
