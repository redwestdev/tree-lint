import chalk from "chalk";

export function logScanPlan(roots: string[], ignore?: string[]) {
  console.log(chalk.bold.green("Will scan the following paths:"));
  roots.forEach((r: string) => console.log(`  ${r}`));

  if (ignore?.length) {
    console.log(
      chalk.bold.yellow("Will ignore paths that match next patterns:"),
    );
    ignore.forEach((i: string) => console.log(`  ${i}`));
  } else {
    console.log(chalk.bold.yellow("No ignored paths."));
  }
  console.log("\n");
}
