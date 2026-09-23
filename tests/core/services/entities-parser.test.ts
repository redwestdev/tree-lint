import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  DirEntity,
  DirNode,
  FileEntity,
  GroupNode,
  LayerNode,
} from "@/core/nodes/index.js";
import {
  annotateEntities,
  annotateGroups,
  annotateLayers,
  buildProjectTree,
} from "@/core/services/index.js";
import type { TAnyNode } from "@/types/nodes.js";
import { createConfig } from "@/utils/index.js";

type TLayerName = "docs" | "i18n" | "styles";
type TEntityName = "locale" | "doc" | "translation" | "styleSheet";

const config = createConfig<TLayerName, TEntityName>({
  roots: ["src/content", "src/styles"],
  ignore: ["node_modules", "dist", "build", ".astro"],
  layers: {
    docs: { entities: ["locale"] },
    i18n: { entities: ["translation"] },
    styles: { entities: ["styleSheet"] },
  },
  entities: {
    locale: {
      matches: { type: "directory", name: "[a-z][a-z]" },
      entities: ["doc"],
    },
    doc: {
      matches: { type: "file", name: "*.{md,mdx}" },
    },
    translation: {
      matches: { type: "file", name: "*.json" },
    },
    styleSheet: {
      matches: { type: "file", name: "*.css" },
    },
  },
});

const LOCALES = ["en", "ru", "uk"];
const DOC_FILES = ["index.mdx", "getting-started/index.mdx", "rules/index.md"];

const nodesByPath = new Map<string, TAnyNode>();

let fixtureRoot = "";

const toRelativePath = (target: string) =>
  path.relative(fixtureRoot, target).split(path.sep).join("/");

const createFixtureFile = async (relativePath: string) => {
  const fullPath = path.join(fixtureRoot, relativePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, "", "utf-8");
};

const collectNodes = (nodes: TAnyNode[]): TAnyNode[] =>
  nodes.flatMap((node) => [
    node,
    ...(node instanceof DirNode ? collectNodes(node.children) : []),
  ]);

const getNode = (relativePath: string) => {
  const node = nodesByPath.get(relativePath);

  expect(
    node,
    `node "${relativePath}" is missing in the annotated tree`,
  ).toBeDefined();

  return node as TAnyNode;
};

beforeAll(async () => {
  fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "tree-lint-nested-"));

  for (const locale of LOCALES) {
    for (const docFile of DOC_FILES)
      await createFixtureFile(`src/content/docs/${locale}/${docFile}`);

    await createFixtureFile(`src/content/i18n/${locale}.json`);
  }

  await createFixtureFile("src/styles/global.css");

  const tree = await buildProjectTree(
    [
      path.join(fixtureRoot, "src/content"),
      path.join(fixtureRoot, "src/styles"),
    ],
    config.ignore,
  );
  const layeredTree = annotateLayers(tree, config);
  const { tree: entitiesTree } = annotateEntities(layeredTree, config);
  const { tree: annotatedTree } = annotateGroups(entitiesTree, config);

  for (const node of collectNodes(annotatedTree.trees))
    nodesByPath.set(toRelativePath(node.path), node);
});

afterAll(async () => {
  if (fixtureRoot) await fs.rm(fixtureRoot, { recursive: true, force: true });
});

describe("nested entities", () => {
  it("annotates sibling directories of a layer as DirEntity of the layer entity", () => {
    for (const locale of LOCALES) {
      const node = getNode(`src/content/docs/${locale}`);

      expect(node).not.toBeInstanceOf(GroupNode);
      expect(node).toBeInstanceOf(DirEntity);
      expect((node as DirEntity).entity).toBe("locale");
    }
  });

  it("annotates nested files of every sibling directory with the nested entity", () => {
    for (const locale of LOCALES) {
      for (const docFile of DOC_FILES) {
        const node = getNode(`src/content/docs/${locale}/${docFile}`);

        expect(node).toBeInstanceOf(FileEntity);
        expect((node as FileEntity).entity).toBe("doc");
      }
    }
  });

  it("does not leak the nested entity into sibling layers", () => {
    const docs = getNode("src/content/docs");

    expect(docs).toBeInstanceOf(LayerNode);

    for (const locale of LOCALES) {
      const translation = getNode(`src/content/i18n/${locale}.json`);

      expect(translation).not.toBeInstanceOf(DirEntity);
      expect(translation).toBeInstanceOf(FileEntity);
      expect((translation as FileEntity).entity).toBe("translation");
    }

    const styleSheet = getNode("src/styles/global.css");

    expect(styleSheet).toBeInstanceOf(FileEntity);
    expect((styleSheet as FileEntity).entity).toBe("styleSheet");
  });

  it("keeps the subtree of every entity directory independent", () => {
    for (const locale of LOCALES) {
      const entity = getNode(`src/content/docs/${locale}`);

      expect(entity).toBeInstanceOf(DirEntity);

      const children = (entity as DirEntity).children
        .map((child) => toRelativePath(child.path))
        .sort();

      expect(children).toEqual([
        `src/content/docs/${locale}/getting-started`,
        `src/content/docs/${locale}/index.mdx`,
        `src/content/docs/${locale}/rules`,
      ]);
    }
  });
});
