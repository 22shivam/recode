#!/usr/bin/env node

import { copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🔄 Resetting bugs for demo...\n");

// Step 1: Copy buggy version back
console.log("1️⃣  Restoring buggy tasks.ts...");
const source = resolve(__dirname, "frontend/convex/tasks.buggy.ts");
const target = resolve(__dirname, "frontend/convex/tasks.ts");

try {
  copyFileSync(source, target);
  console.log("✅ Bugs restored!\n");
} catch (error) {
  console.error("❌ Error copying file:", error.message);
  process.exit(1);
}

// Step 2: Clear history
console.log("2️⃣  Clearing error and fix history...");

const clearProcess = spawn("node", ["agent/clear-history.js"], {
  cwd: __dirname,
  stdio: "inherit",
});

clearProcess.on("close", (code) => {
  if (code === 0) {
    console.log("\n🎉 Ready to demo again!\n");
    console.log("Now you can:");
    console.log("  1. Try to add a task → will fail (Bug #1)");
    console.log("  2. Try to toggle task → will fail (Bug #2)");
    console.log("  3. Try to delete task → will fail (Bug #3)\n");
    console.log("Agent will fix them automatically! 🤖\n");
  } else {
    console.error("❌ Failed to clear history");
    process.exit(1);
  }
});
