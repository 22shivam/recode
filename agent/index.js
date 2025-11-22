import Anthropic from "@anthropic-ai/sdk";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../frontend/convex/_generated/api.js";
import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config({ path: "../frontend/.env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

console.log("🤖 ReCode Agent Started!");
console.log("📡 Connected to Convex:", process.env.NEXT_PUBLIC_CONVEX_URL);
console.log("👁️  Monitoring for errors...\n");

// Track which errors we've already tried to fix
const attemptedFixes = new Set();

async function pollForErrors() {
  try {
    const errors = await convex.query(api.errors.getUnresolved);

    if (errors.length > 0) {
      // Filter out errors we've already attempted
      const newErrors = errors.filter(
        (error) => !attemptedFixes.has(error._id)
      );

      if (newErrors.length > 0) {
        console.log(`\n🔴 Found ${newErrors.length} new error(s)!`);
        for (const error of newErrors) {
          await fixError(error);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error polling Convex:", error.message);
  }
}

async function fixError(error) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🐛 Error in: ${error.functionName}`);
  console.log(`📝 Message: ${error.errorMessage}`);

  // Mark this error as attempted
  attemptedFixes.add(error._id);

  try {
    // Determine which file to fix based on function name
    const filePath = getFilePath(error.functionName);
    console.log(`📂 Reading file: ${filePath}`);

    // Read the broken code
    const brokenCode = await readFile(filePath, "utf-8");

    console.log(`🤖 Asking Claude AI to fix the code...`);

    // Ask Claude to fix it
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `You are a Convex TypeScript debugger. Fix this error in the code.

ERROR: ${error.errorMessage}

FUNCTION NAME: ${error.functionName}

CURRENT CODE:
\`\`\`typescript
${brokenCode}
\`\`\`

INSTRUCTIONS:
1. Identify the bug causing this error
2. Fix ONLY the bug - don't change anything else
3. Return ONLY the raw TypeScript code - no markdown code blocks, no explanations, no \`\`\`
4. Keep all import statements exactly as they are
5. Keep all comments and structure the same
6. The fix should be minimal - just change what's broken

IMPORTANT: Return ONLY the TypeScript code. Do NOT wrap it in \`\`\`typescript or any markdown formatting.

Return the complete fixed file:`,
        },
      ],
    });

    let fixedCode = response.content[0].text.trim();

    // Extract code from markdown blocks if Claude wrapped it despite instructions
    const codeBlockMatch = fixedCode.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      fixedCode = codeBlockMatch[1].trim();
      console.log("⚠️  Extracted code from markdown block");
    }

    console.log(`✅ Claude generated a fix!`);

    // Validate the fix has required imports
    if (!fixedCode.includes('import') || !fixedCode.includes('mutation') || !fixedCode.includes('query')) {
      throw new Error("Invalid fix: Missing required imports or exports");
    }

    // Show a preview
    console.log(`\n📝 Preview of fix (first 300 chars):`);
    console.log(fixedCode.substring(0, 300) + "...\n");

    console.log(`💾 Writing fixed code back to ${filePath}...`);

    // Write the fix back
    await writeFile(filePath, fixedCode, "utf-8");

    console.log(`📊 Logging fix to Convex...`);

    // Log the fix to Convex
    await convex.mutation(api.fixes.logFix, {
      errorId: error._id,
      originalCode: brokenCode.substring(0, 500), // Store snippet
      fixedCode: fixedCode.substring(0, 500), // Store snippet
      reasoning: `Fixed ${error.functionName}: ${error.errorMessage}`,
    });

    // Mark error as resolved
    await convex.mutation(api.errors.markResolved, {
      errorId: error._id,
    });

    console.log(`✨ Fix complete! Convex will auto-reload the function.`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Remove from attempted fixes after successful fix
    attemptedFixes.delete(error._id);
  } catch (err) {
    console.error(`❌ Failed to fix error:`, err.message);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
}

function getFilePath(functionName) {
  // Extract the file name from function name (e.g., "tasks.addTask" -> "tasks")
  const fileName = functionName.split(".")[0];
  return join(__dirname, "..", "frontend", "convex", `${fileName}.ts`);
}

// Poll every 3 seconds
setInterval(pollForErrors, 3000);

// Initial poll
pollForErrors();
