/**
 * Parse voice transcript to detect commands
 * Now uses Claude AI for robust natural language understanding
 */

import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const COMMANDS = {
  APPROVE: [
    "approve",
    "approve the fix",
    "approve fix",
    "yes approve",
    "apply the fix",
    "apply fix",
    "looks good",
    "accept",
    "accept the fix",
  ],
  REJECT: [
    "reject",
    "reject the fix",
    "reject fix",
    "no reject",
    "don't apply",
    "decline",
    "decline the fix",
  ],
  STATUS: [
    "status",
    "what's the status",
    "show status",
    "show me errors",
    "what errors",
    "any errors",
    "system status",
  ],
  LIST_PENDING: [
    "list pending",
    "pending fixes",
    "show pending",
    "what needs approval",
    "what's pending",
  ],
};

/**
 * Normalize text for matching
 */
function normalizeText(text) {
  return text.toLowerCase().trim().replace(/[?.!,]/g, "");
}

/**
 * Check if text contains a command
 */
function containsCommand(text, commandPhrases) {
  const normalized = normalizeText(text);
  return commandPhrases.some((phrase) => {
    const normalizedPhrase = normalizeText(phrase);
    return (
      normalized === normalizedPhrase ||
      normalized.includes(normalizedPhrase) ||
      normalizedPhrase.includes(normalized)
    );
  });
}

/**
 * Use Claude to parse natural language intent
 * @param {string} text - The transcript text
 * @returns {Promise<Object|null>} - {type: string, confidence: number, reasoning: string}
 */
async function parseWithClaude(text) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `You are a voice command parser for a code-fixing system. Parse this transcript and determine the user's intent.

Transcript: "${text}"

Available commands:
- APPROVE: User wants to approve/accept a pending fix
- REJECT: User wants to reject/decline a pending fix
- STATUS: User wants to know system status/errors
- LIST_PENDING: User wants to see pending fixes
- NONE: Not a command, just conversation

Return ONLY a JSON object in this format:
{
  "command": "APPROVE|REJECT|STATUS|LIST_PENDING|NONE",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}

Examples:
"yeah approve it" → {"command": "APPROVE", "confidence": 0.95, "reasoning": "clear approval"}
"I'm not sure about this one" → {"command": "REJECT", "confidence": 0.7, "reasoning": "uncertainty suggests rejection"}
"how are things going" → {"command": "STATUS", "confidence": 0.8, "reasoning": "asking about status"}
"hello there" → {"command": "NONE", "confidence": 0.99, "reasoning": "just greeting"}`,
        },
      ],
    });

    const content = response.content[0].text.trim();

    // Try to parse JSON from Claude's response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("Claude didn't return valid JSON");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.command === "NONE" || parsed.confidence < 0.6) {
      return null;
    }

    return {
      type: parsed.command,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      text: text,
    };
  } catch (error) {
    console.error("❌ Error parsing with Claude:", error.message);
    return null;
  }
}

/**
 * Parse segments to detect command type
 * Now uses Claude AI for natural language understanding!
 * @param {Array} segments - Transcript segments from Omi
 * @returns {Promise<Object|null>} - {type: string, confidence: number, text: string}
 */
export async function parseCommand(segments) {
  if (!segments || segments.length === 0) {
    return null;
  }

  // Combine recent segments (last 5 seconds)
  const recentText = segments
    .slice(-3)
    .map((s) => s.text)
    .join(" ");

  if (!recentText) {
    return null;
  }

  // Use Claude for natural language understanding
  console.log(`🤖 Asking Claude to parse: "${recentText}"`);
  const claudeResult = await parseWithClaude(recentText);

  if (claudeResult) {
    console.log(`✅ Claude parsed: ${claudeResult.type} (${(claudeResult.confidence * 100).toFixed(0)}%) - ${claudeResult.reasoning}`);
    return claudeResult;
  }

  console.log(`ℹ️  Claude couldn't parse command, no action taken`);
  return null;
}

/**
 * Get help text for commands
 */
export function getCommandHelp() {
  return `Available voice commands:
• "approve the fix" - Approve pending fixes
• "reject the fix" - Reject pending fixes
• "what's the status" - Get system status
• "list pending" - See pending approvals`;
}
