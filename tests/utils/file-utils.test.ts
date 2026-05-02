import { describe, expect, it, vi } from "vitest";
import fs from "fs/promises";
vi.mock(import("fs/promises"));

import { saveToJson } from "@/utils/index.js";
import { TAnyTree } from "@/types/trees.js";

interface ITree {
  generatedAt: string;
  trees: Array<{
    name: string;
    path: string;
    children?: Array<{ name: string; path: string }>;
  }>;
}

const tree = {
  generatedAt: "2026-05-01T00:00:00Z",
  trees: [
    {
      name: "file",
      path: "usr/bin/path/file.txt",
    },
    {
      name: "directory",
      path: "usr/bin/path/directory",
      children: [{ name: "file2", path: "usr/bin/path/directory/file2.txt" }],
    },
  ],
};

const outputPath = "./tree.json";

const cwd = "usr/bin/path";

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
});
