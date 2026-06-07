import { performance } from "node:perf_hooks";

import { DirNode } from "@/core/nodes/index.js";
import type { TAnyNode } from "@/types/nodes.js";

export const countNodes = (node: TAnyNode): number => {
  let count = 1;

  if (node instanceof DirNode && node.children) {
    for (const child of node.children) {
      count += countNodes(child);
    }
  }

  return count;
};

export const getVitals = () => {
  const usage = process.memoryUsage();
  const cpu = process.cpuUsage();

  return {
    timestamp: performance.now(),
    memory: {
      heapUsed: usage.heapUsed / 1024 / 1024,
      rss: usage.rss / 1024 / 1024,
    },
    cpu,
  };
};

export const printReport = (
  startVitals: ReturnType<typeof getVitals>,
  nodeCount: number,
) => {
  const endVitals = getVitals();

  const wallClockTime = (endVitals.timestamp - startVitals.timestamp) / 1000;

  const cpuUserSec = (endVitals.cpu.user - startVitals.cpu.user) / 1000000;
  const cpuSystemSec =
    (endVitals.cpu.system - startVitals.cpu.system) / 1000000;
  const cpuTotalSec = cpuUserSec + cpuSystemSec;

  const ioWait = Math.max(0, wallClockTime - cpuTotalSec);

  const cpuUtilization = ((cpuTotalSec / wallClockTime) * 100).toFixed(1);

  console.log("\n--- CORE ENGINE PERFORMANCE METRICS ---");
  console.log(`Throughput:      ${nodeCount} nodes processed`);
  console.log(
    `Wall-Clock:      ${wallClockTime.toFixed(2)}s (Total elapsed time)`,
  );

  console.log("\n--- CPU UTILIZATION BREAKDOWN ---");

  console.log(`User Land:   ${(cpuUserSec * 1000).toFixed(2)}ms (Our logic)`);
  console.log(
    `System Land:   ${(cpuSystemSec * 1000).toFixed(2)}ms (OS overhead)`,
  );
  console.log(
    `I/O Wait:    ${ioWait.toFixed(2)}s (Idle time: Waiting for Disk/SSD)`,
  );

  console.log("\n--- RESOURCE FOOTPRINT ---");
  console.log(
    `Memory Delta:    +${(endVitals.memory.heapUsed - startVitals.memory.heapUsed).toFixed(2)} MB (Heap memory usage)`,
  );
  console.log(`CPU Utilization:  ${cpuUtilization}% (How busy the CPU was)`);
  console.log("-------------------------------------------\n");
};
