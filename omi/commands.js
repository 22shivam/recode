/**
 * Parse voice transcript to detect commands
 */

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
 * Parse segments to detect command type
 * @param {Array} segments - Transcript segments from Omi
 * @returns {Object|null} - {type: string, confidence: number, text: string}
 */
export function parseCommand(segments) {
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

  // Check for approve command
  if (containsCommand(recentText, COMMANDS.APPROVE)) {
    return {
      type: "APPROVE",
      confidence: 0.9,
      text: recentText,
    };
  }

  // Check for reject command
  if (containsCommand(recentText, COMMANDS.REJECT)) {
    return {
      type: "REJECT",
      confidence: 0.9,
      text: recentText,
    };
  }

  // Check for status command
  if (containsCommand(recentText, COMMANDS.STATUS)) {
    return {
      type: "STATUS",
      confidence: 0.85,
      text: recentText,
    };
  }

  // Check for list pending command
  if (containsCommand(recentText, COMMANDS.LIST_PENDING)) {
    return {
      type: "LIST_PENDING",
      confidence: 0.85,
      text: recentText,
    };
  }

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
