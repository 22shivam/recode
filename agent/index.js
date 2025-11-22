import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../frontend/convex/_generated/api.js";
import { readFile, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config({ path: "../frontend/.env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Omi configuration
const OMI_UID = process.env.OMI_UID; // User's Omi UID
const OMI_APP_ID = process.env.OMI_APP_ID;
const OMI_APP_SECRET = process.env.OMI_APP_SECRET;
const OMI_ENABLED = OMI_UID && OMI_APP_ID && OMI_APP_SECRET;

console.log("🤖 ReCode Agent Started!");
console.log("📡 Connected to Convex:", process.env.NEXT_PUBLIC_CONVEX_URL);
if (OMI_ENABLED) {
  console.log("🎤 Omi notifications enabled for UID:", OMI_UID);
} else {
  console.log("ℹ️  Omi notifications disabled (set OMI_UID, OMI_APP_ID, OMI_APP_SECRET to enable)");
}
console.log("👁️  Monitoring for errors...\n");

// Omi notification helper
async function sendOmiNotification(message) {
  if (!OMI_ENABLED) return false;

  try {
    const url = `https://api.omi.me/v2/integrations/${OMI_APP_ID}/notification`;
    await axios.post(
      url,
      null,
      {
        headers: {
          Authorization: `Bearer ${OMI_APP_SECRET}`,
          "Content-Type": "application/json",
        },
        params: { uid: OMI_UID, message },
        timeout: 10000,
      }
    );
    console.log(`🎤 Omi notification sent: "${message}"`);
    return true;
  } catch (error) {
    console.error(`⚠️  Failed to send Omi notification:`, error.message);
    return false;
  }
}

// Track which errors we've already tried to fix
const attemptedFixes = new Set();

// Check for approved fixes and apply them
async function pollForApprovedFixes() {
  try {
    const approvedFixes = await convex.query(api.fixes.getApprovedFixes);

    if (approvedFixes.length > 0) {
      console.log(`\n✅ Found ${approvedFixes.length} approved fix(es)!`);
      for (const fix of approvedFixes) {
        await applyApprovedFix(fix);
      }
    }
  } catch (error) {
    console.error("❌ Error polling for approved fixes:", error.message);
  }
}

async function applyApprovedFix(fix) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`👤 Applying human-approved fix...`);
  console.log(`📝 Reasoning: ${fix.reasoning}`);

  try {
    // Get the error to find the file path
    const error = await convex.query(api.errors.getAllErrors);
    const errorDoc = error.find(e => e._id === fix.errorId);

    if (!errorDoc) {
      console.error("❌ Error not found, skipping fix");
      return;
    }

    const filePath = getFilePath(errorDoc.functionName);
    console.log(`📂 Writing approved fix to: ${filePath}`);

    // Apply the approved fix
    await writeFile(filePath, fix.fixedCode, "utf-8");

    console.log(`📊 Updating fix status to applied...`);

    // Update fix status to applied
    await convex.mutation(api.fixes.logFix, {
      errorId: fix.errorId,
      errorPattern: fix.errorPattern || "",
      embedding: fix.embedding || [],
      originalCode: fix.originalCode,
      fixedCode: fix.fixedCode,
      reasoning: fix.reasoning,
      confidence: fix.confidence,
      status: "applied",
      appliedAt: Date.now(),
    });

    // Delete the pending fix
    await convex.mutation(api.fixes.deleteFix, { id: fix._id });

    // Mark error as resolved
    await convex.mutation(api.errors.markResolved, {
      errorId: fix.errorId,
    });

    // Remove from attempted fixes
    attemptedFixes.delete(fix.errorId);

    console.log(`✨ Approved fix applied! Convex will auto-reload.`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  } catch (err) {
    console.error(`❌ Failed to apply approved fix:`, err.message);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
}

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

  // Send Omi notification about error detection
  await sendOmiNotification(
    `⚠️ ReCode Alert: Error detected in ${error.functionName}. Agent analyzing now...`
  );

  // Mark this error as attempted
  attemptedFixes.add(error._id);

  const startTime = Date.now();

  try {
    // Create error pattern for semantic matching
    const errorPattern = `${error.functionName}: ${error.errorMessage}`;

    // Generate embedding for this error
    console.log(`🔍 Searching for similar past fixes...`);
    const embedding = await generateEmbedding(errorPattern);

    // Search for similar fixes in Convex vector store (using action for vector search)
    const similarFixes = await convex.action(api.fixes.searchSimilarFixes, {
      embedding: embedding,
      limit: 1,
    });

    // If we found a similar fix with high confidence, use it!
    if (similarFixes.length > 0) {
      const bestMatch = similarFixes[0];
      const similarity = bestMatch._score || 0; // Convex returns similarity score

      console.log(`\n💡 Found similar past fix! (Similarity: ${(similarity * 100).toFixed(1)}%)`);
      console.log(`   Pattern: "${bestMatch.errorPattern}"`);
      console.log(`   Times used: ${bestMatch.timesApplied || 1}x`);

      // If similarity is high enough, reuse the fix
      if (similarity > 0.85) {
        const elapsedMs = Date.now() - startTime;
        console.log(`\n⚡ INSTANT FIX from memory! (${elapsedMs}ms)`);
        console.log(`📂 Reading file: ${getFilePath(error.functionName)}`);

        // Apply the cached fix
        const filePath = getFilePath(error.functionName);
        await writeFile(filePath, bestMatch.fixedCode, "utf-8");

        // Increment usage counter
        await convex.mutation(api.fixes.incrementFixUsage, {
          fixId: bestMatch._id,
        });

        // Mark error as resolved
        await convex.mutation(api.errors.markResolved, {
          errorId: error._id,
        });

        console.log(`✨ Applied cached fix! No Claude API call needed.`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // Remove from attempted fixes after successful application
        attemptedFixes.delete(error._id);
        return;
      } else {
        console.log(`   Similarity too low (${(similarity * 100).toFixed(1)}% < 85%), asking Claude for fresh analysis...`);
      }
    } else {
      console.log(`   No similar fixes found in memory, asking Claude...`);
    }

    // No cached fix found or similarity too low, proceed with Claude
    const filePath = getFilePath(error.functionName);
    console.log(`📂 Reading file: ${filePath}`);

    // Read the broken code
    const brokenCode = await readFile(filePath, "utf-8");

    console.log(`🤖 Asking Claude AI to fix the code...`);

    // Ask Claude to fix it with confidence scoring
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
3. Return your response in this EXACT JSON format:
{
  "confidence": <number 0-100>,
  "reasoning": "<brief explanation of the fix>",
  "fixedCode": "<the complete fixed TypeScript code>"
}

CONFIDENCE SCORING:
- 90-100: Simple, obvious fix (e.g., typo, wrong field name)
- 70-89: Clear fix but requires some logic changes
- 50-69: Fix works but may have edge cases
- Below 50: Uncertain, needs human review

IMPORTANT:
- Return ONLY valid JSON, no markdown, no code blocks
- The fixedCode should be the complete file with minimal changes
- Keep all import statements exactly as they are`,
        },
      ],
    });

    const responseText = response.content[0].text.trim();

    // Parse Claude's JSON response
    let fixResult;
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        fixResult = JSON.parse(jsonMatch[0]);
      } else {
        fixResult = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error("⚠️  Failed to parse JSON response, falling back to direct code");
      // Fallback: treat entire response as code with high confidence
      fixResult = {
        confidence: 75,
        reasoning: "Fix generated (JSON parse failed)",
        fixedCode: responseText
      };
    }

    let fixedCode = fixResult.fixedCode.trim();
    const confidence = fixResult.confidence || 75;
    const reasoning = fixResult.reasoning || "Fix generated by Claude";

    // Extract code from markdown blocks if Claude wrapped it despite instructions
    const codeBlockMatch = fixedCode.match(/```(?:typescript|ts)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      fixedCode = codeBlockMatch[1].trim();
      console.log("⚠️  Extracted code from markdown block");
    }

    console.log(`✅ Claude generated a fix!`);
    console.log(`🎯 Confidence: ${confidence}%`);
    console.log(`💭 Reasoning: ${reasoning}`);

    // Validate the fix has required imports
    if (!fixedCode.includes('import') || !fixedCode.includes('mutation') || !fixedCode.includes('query')) {
      throw new Error("Invalid fix: Missing required imports or exports");
    }

    // Show a preview
    console.log(`\n📝 Preview of fix (first 300 chars):`);
    console.log(fixedCode.substring(0, 300) + "...\n");

    const CONFIDENCE_THRESHOLD = 101;

    // Check if confidence is high enough for auto-apply
    if (confidence >= CONFIDENCE_THRESHOLD) {
      console.log(`✅ Confidence ${confidence}% >= ${CONFIDENCE_THRESHOLD}% threshold - Auto-applying!`);
      console.log(`💾 Writing fixed code back to ${filePath}...`);

      // Write the fix back
      await writeFile(filePath, fixedCode, "utf-8");

      console.log(`📊 Logging fix to Convex with embedding...`);

      // Log the fix to Convex with embedding and mark as applied
      await convex.mutation(api.fixes.logFix, {
        errorId: error._id,
        errorPattern: errorPattern,
        embedding: embedding,
        originalCode: brokenCode.substring(0, 500),
        fixedCode: fixedCode,
        reasoning: reasoning,
        confidence: confidence,
        status: "applied",
        appliedAt: Date.now(),
      });

      const elapsedMs = Date.now() - startTime;
      console.log(`⏱️  Total fix time: ${elapsedMs}ms`);

      // Mark error as resolved
      await convex.mutation(api.errors.markResolved, {
        errorId: error._id,
      });

      console.log(`✨ Fix complete! Convex will auto-reload the function.`);

      // Send Omi notification about successful fix
      await sendOmiNotification(
        `✅ ReCode: Fix applied to ${error.functionName}! Confidence: ${confidence}%. Your app healed automatically in ${(elapsedMs / 1000).toFixed(1)}s.`
      );

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // Remove from attempted fixes after successful fix
      attemptedFixes.delete(error._id);
    } else {
      console.log(`⚠️  Confidence ${confidence}% < ${CONFIDENCE_THRESHOLD}% threshold - Pending approval`);
      console.log(`📊 Logging fix to Convex for manual review...`);

      // Log the fix but mark as pending
      await convex.mutation(api.fixes.logFix, {
        errorId: error._id,
        errorPattern: errorPattern,
        embedding: embedding,
        originalCode: brokenCode.substring(0, 500),
        fixedCode: fixedCode,
        reasoning: reasoning,
        confidence: confidence,
        status: "pending",
      });

      const elapsedMs = Date.now() - startTime;
      console.log(`⏱️  Analysis time: ${elapsedMs}ms`);

      console.log(`👤 Awaiting human approval in dashboard...`);

      // Send Omi notification about pending approval
      await sendOmiNotification(
        `🤔 ReCode: Low-confidence fix ready for ${error.functionName} (${confidence}%). Say "approve fix" or check the dashboard to review.`
      );

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // Keep error as unresolved until fix is approved
      // Don't remove from attempted fixes - we'll monitor for approval
    }
  } catch (err) {
    console.error(`❌ Failed to fix error:`, err.message);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  }
}

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("❌ Error generating embedding:", error.message);
    throw error;
  }
}

function getFilePath(functionName) {
  // Extract the file name from function name (e.g., "tasks.addTask" -> "tasks")
  const fileName = functionName.split(".")[0];
  return join(__dirname, "..", "frontend", "convex", `${fileName}.ts`);
}

// Poll every 3 seconds
setInterval(pollForErrors, 3000);
setInterval(pollForApprovedFixes, 3000);

// Initial polls
pollForErrors();
pollForApprovedFixes();
