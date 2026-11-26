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

/** Runs the command and returns the first exit code requested via process.exit. */
const run = async (...args: string[]) => {
  await scanCommand.parseAsync(args, { from: "user" });
  return exitCodes[0];
};

const stdoutJson = () => {
  const call = writeSyncMock.mock.calls.find(([fd]) => fd === 1);
  return call ? JSON.parse(String(call[1])) : undefined;
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

describe("scan --json", () => {
  it("prints a JSON report to stdout and exits with 1 on errors", async () => {
    const code = await run(".", "--json");
    const report = stdoutJson();

    expect(code).toBe(1);
    expect(report.errors).toBe(1);
    expect(report.violations[0]).toMatchObject({ type: "error" });
    expect(report.violations[0].path).toContain("Bad.ts");
    expect(console.log).not.toHaveBeenCalled();
  });

  it("writes the report to a file relative to the project root", async () => {
    await run(".", "--json", "report.json");

    const file = path.join(dir, "report.json");
    expect(JSON.parse(fs.readFileSync(file, "utf-8")).errors).toBe(1);
    expect(stdoutJson()).toBeUndefined();
  });

  it("exits with 0 and keeps the report with --no-fail-on-error", async () => {
    const code = await run(".", "--json", "--no-fail-on-error");

    expect(code).toBe(0);
    expect(stdoutJson().errors).toBe(1);
  });
});
