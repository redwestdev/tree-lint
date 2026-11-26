import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const writeSyncMock = vi.hoisted(() => vi.fn());

vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return {
    ...actual,
    default: { ...actual, writeSync: writeSyncMock },
    writeSync: writeSyncMock,
  };
});

import { scanCommand } from "@/commands/scan.js";

const config = {
  roots: ["src"],
  ignore: ["node_modules"],
  entities: {
    util: {
      matches: { type: "file", name: "*.ts" },
      rules: { name: { type: "error", pattern: "use*" } },
    },
  },
  layers: { utils: { entities: ["util"] } },
};

let dir: string;
let cwd: string;
let exitCodes: (number | undefined)[];
let stdoutChunks: string[];

/** Runs the command and returns the first exit code requested via process.exit. */
const run = async (...args: string[]) => {
  await scanCommand.parseAsync(args, { from: "user" });
  return exitCodes[0];
};

const stdoutJson = () => {
  const output = stdoutChunks.join("");
  return output ? JSON.parse(output) : undefined;
};

beforeEach(() => {
  cwd = process.cwd();
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "tree-lint-scan-"));
  fs.mkdirSync(path.join(dir, "src", "utils"), { recursive: true });
  fs.writeFileSync(path.join(dir, "src", "utils", "Bad.ts"), "export {};\n");
  fs.writeFileSync(
    path.join(dir, "tree-lint.config.json"),
    JSON.stringify(config),
  );
  process.chdir(dir);

  exitCodes = [];
  stdoutChunks = [];
  vi.spyOn(process.stdout, "write").mockImplementation(((
    chunk: string | Uint8Array,
  ) => {
    stdoutChunks.push(String(chunk));
    return true;
  }) as never);
  vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    exitCodes.push(code);
  }) as never);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  process.chdir(cwd);
  fs.rmSync(dir, { recursive: true, force: true });
  vi.restoreAllMocks();
  // commander keeps parsed option values between parseAsync calls
  for (const opt of scanCommand.options)
    scanCommand.setOptionValue(opt.attributeName(), undefined);
});

describe("scan --report", () => {
  it("prints a JSON report to stdout and exits with 1 on errors", async () => {
    const code = await run(".", "--report");
    const report = stdoutJson();

    expect(code).toBe(1);
    expect(report.errors).toBe(1);
    expect(report.root).toEqual(["src"]);
    const [violationPath] = Object.keys(report.grouped);
    expect(violationPath).toContain("Bad.ts");
    expect(report.grouped[violationPath].error).toHaveLength(1);
    expect(console.log).not.toHaveBeenCalled();
  });

  it("writes the report to a file relative to the project root", async () => {
    await run(".", "--report", "report.json");

    const file = path.join(dir, "report.json");
    const report = JSON.parse(fs.readFileSync(file, "utf-8"));
    expect(report.errors).toBe(1);
    expect(report.root).toEqual(["src"]);
    expect(stdoutJson()).toBeUndefined();
  });

  it("exits with 0 and keeps the report with --no-fail-on-error", async () => {
    const code = await run(".", "--report", "--no-fail-on-error");

    expect(code).toBe(0);
    expect(stdoutJson().errors).toBe(1);
  });
});
