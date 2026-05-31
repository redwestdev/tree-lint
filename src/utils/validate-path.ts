import path from "path";
import mm from "micromatch";
import chalk from "chalk";

export function validateInitialPaths(
  projectPath: string,
  roots: string[] = [],
  ignore: string[] = [],
) {
  const absoluteRoots: string[] = roots?.length
    ? roots
        .map((r: string) => path.resolve(projectPath, r))
        .filter((p) => {
          const isInside = p
            .toLowerCase()
            .startsWith(projectPath.toLowerCase());
          if (!isInside) {
            console.warn(
              chalk.yellowBright(
                `Access denied: path ${p} is outside the project root and will be ignored.\n`,
              ),
            );
          }
          return isInside;
        })
    : [projectPath];

  const sortedPaths = [...new Set(absoluteRoots)]
    .map((p) => p.replace(/\\/g, "/"))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((p) => p.split("/"));

  if (!sortedPaths.length) return [];

  const finalPaths = [sortedPaths[0]];

  let current = sortedPaths[0];

  for (let i = 1; i < sortedPaths.length; i++) {
    const path = sortedPaths[i];

    const isChild =
      current.length <= path.length &&
      current.every(
        (item, index) => item.toLowerCase() === path[index].toLowerCase(),
      );

    if (!isChild) {
      finalPaths.push(path);
      current = path;
    }
  }

  return finalPaths
    .map((p) => {
      const joined = path.join(...p);
      return p[0] === "" && !joined.startsWith(path.sep)
        ? path.sep + joined
        : joined;
    })
    .filter(
      (fullPath) => !ignore.some((pattern) => mm.isMatch(fullPath, pattern)),
    );
}
