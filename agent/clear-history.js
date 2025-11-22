import { ConvexHttpClient } from "convex/browser";
import { api } from "../frontend/convex/_generated/api.js";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../frontend/.env.local");

dotenv.config({ path: envPath });

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  console.error(`   Tried to load from: ${envPath}`);
  process.exit(1);
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function clearHistory() {
  try {
    console.log("🗑️  Clearing all errors and fixes from Convex...");

    // Get all errors
    const errors = await convex.query(api.errors.getAllErrors);
    console.log(`   Found ${errors.length} errors to delete`);

    // Delete all errors
    for (const error of errors) {
      await convex.mutation(api.errors.deleteError, { id: error._id });
    }

    // Get all fixes
    const fixes = await convex.query(api.fixes.getAllFixes);
    console.log(`   Found ${fixes.length} fixes to delete`);

    // Delete all fixes
    for (const fix of fixes) {
      await convex.mutation(api.fixes.deleteFix, { id: fix._id });
    }

    console.log("✨ All history cleared!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing history:", error.message);
    process.exit(1);
  }
}

clearHistory();
