import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const OMI_APP_ID = process.env.OMI_APP_ID;
const OMI_APP_SECRET = process.env.OMI_APP_SECRET;

/**
 * Send a proactive notification to an Omi user
 * @param {string} uid - User ID from Omi
 * @param {string} message - Notification message
 * @returns {Promise<boolean>} - Success status
 */
export async function sendOmiNotification(uid, message) {
  if (!OMI_APP_ID || !OMI_APP_SECRET) {
    console.error("❌ OMI_APP_ID and OMI_APP_SECRET must be set");
    return false;
  }

  if (!uid) {
    console.error("❌ UID is required to send notification");
    return false;
  }

  try {
    const url = `https://api.omi.me/v2/integrations/${OMI_APP_ID}/notification`;

    const response = await axios.post(
      url,
      null,
      {
        headers: {
          Authorization: `Bearer ${OMI_APP_SECRET}`,
          "Content-Type": "application/json",
        },
        params: {
          uid: uid,
          message: message,
        },
        timeout: 30000,
      }
    );

    console.log(`✅ Omi notification sent to ${uid}: "${message}"`);
    return true;
  } catch (error) {
    console.error(
      `❌ Failed to send Omi notification:`,
      error.response?.data || error.message
    );
    return false;
  }
}

/**
 * Send error detection notification
 */
export async function notifyError(uid, errorInfo) {
  const message = `⚠️ ReCode Alert: Error detected in ${errorInfo.functionName}. Agent is analyzing the issue now...`;
  return sendOmiNotification(uid, message);
}

/**
 * Send fix applied notification
 */
export async function notifyFixApplied(uid, fixInfo) {
  const message = `✅ ReCode: Fix applied to ${fixInfo.functionName}! Confidence: ${fixInfo.confidence}%. Your app is healing automatically.`;
  return sendOmiNotification(uid, message);
}

/**
 * Send pending approval notification
 */
export async function notifyPendingApproval(uid, fixInfo) {
  const message = `🤔 ReCode: Low-confidence fix ready for ${fixInfo.functionName} (${fixInfo.confidence}%). Say "approve fix" or check the dashboard to review.`;
  return sendOmiNotification(uid, message);
}

/**
 * Send status update notification
 */
export async function notifyStatus(uid, statusInfo) {
  const { totalErrors, pendingFixes, appliedFixes } = statusInfo;
  const message = `📊 ReCode Status: ${totalErrors} errors detected, ${appliedFixes} auto-fixed, ${pendingFixes} awaiting approval.`;
  return sendOmiNotification(uid, message);
}
