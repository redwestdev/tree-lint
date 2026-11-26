import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock(import("node:fs/promises"));

import type { TAnyTree } from "@/types/trees.js";
import { saveToJson } from "@/utils/index.js";

interface ITree {
  generatedAt: string;
  trees: Array<{
    name: string;
    path: string;
    children?: Array<{ name: string; path: string }>;
  }>;
}

const cwd = path.resolve("usr/bin/path");

const tree = {
  generatedAt: "2026-05-01T00:00:00Z",
  trees: [
    {
      name: "file",
      path: path.join(cwd, "file.txt"),
    },
    {
      name: "directory",
      path: path.join(cwd, "directory"),
      children: [
        {
          name: "file2",
          path: path.join(cwd, "directory", "file2.txt"),
        },
      ],
    },
  ],
};

const outputPath = "./tree.json";

describe("file utils", () => {
  it("saveToJson should transform paths and save to file", async () => {
    await saveToJson(tree as unknown as TAnyTree, outputPath, cwd);

    expect(fs.writeFile).toHaveBeenCalledWith(
      outputPath,
      expect.any(String),
      "utf-8",
    );
  });

  it("saveToJson should transform paths to relative", async () => {
    await saveToJson(tree as unknown as TAnyTree, outputPath, cwd);

    const jsonString = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
    const savedData = JSON.parse(jsonString) as ITree;

    expect(savedData.trees[0].path).toBe("file.txt");

    const childPath = savedData.trees[1].children
      ? savedData.trees[1].children[0].path
      : "";

    expect(childPath).toBe("directory/file2.txt");
  });

  it("saveToJson should normalize absolute values and object keys", async () => {
    const root = path.join(path.sep, "project");
    const groupedPath = path.join(root, "src", "pages", "HomePage");
    const report = {
      root,
      grouped: {
        [groupedPath]: { error: [], warning: [] },
        "Name does not match": {
          error: [path.join(root, "src", "pages", "HomePage", "index.ts")],
          warning: [],
        },
      },
    };

    await saveToJson(report, outputPath, root);

    const jsonString = vi.mocked(fs.writeFile).mock.calls.at(-1)?.[1] as string;
    const savedData = JSON.parse(jsonString);

    expect(savedData.root).toBe(".");
    expect(savedData.grouped[path.join("src", "pages", "HomePage")]).toEqual({
      error: [],
      warning: [],
    });
    expect(savedData.grouped["Name does not match"].error).toEqual([
      path.join("src", "pages", "HomePage", "index.ts"),
    ]);
  });
});
