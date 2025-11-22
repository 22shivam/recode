#!/usr/bin/env node

import { copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("🔄 Resetting bugs (keeping history for vector search testing)...\n");

// Copy buggy version back
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

console.log("🧠 Kept error and fix history for vector search testing\n");
console.log("🎉 Ready to test vector search!\n");
console.log("Now you can:");
console.log("  1. Trigger the same errors again");
console.log("  2. Watch the agent find similar fixes in memory");
console.log("  3. See instant fixes (<1s) using cached solutions! ⚡\n");
console.log("Expected behavior:");
console.log("  • First time: Claude analyzes (~6s)");
console.log("  • Second time: Instant fix from cache (~300ms) 🧠\n");
