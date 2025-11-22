import { ConvexHttpClient } from "convex/browser";
import { api } from "../frontend/convex/_generated/api.js";
import dotenv from "dotenv";

dotenv.config({ path: "../frontend/.env.local" });

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

console.log("📡 Omi server connected to Convex:", process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Get all errors
 */
export async function getAllErrors() {
  try {
    return await convex.query(api.errors.getAllErrors);
  } catch (error) {
    console.error("❌ Error fetching errors:", error.message);
    return [];
  }
}

/**
 * Get pending fixes
 */
export async function getPendingFixes() {
  try {
    return await convex.query(api.fixes.getPendingFixes);
  } catch (error) {
    console.error("❌ Error fetching pending fixes:", error.message);
    return [];
  }
}

/**
 * Get all fixes
 */
export async function getAllFixes() {
  try {
    return await convex.query(api.fixes.getAllFixes);
  } catch (error) {
    console.error("❌ Error fetching fixes:", error.message);
    return [];
  }
}

/**
 * Approve a fix
 */
export async function approveFix(fixId) {
  try {
    return await convex.mutation(api.fixes.approveFix, { fixId });
  } catch (error) {
    console.error("❌ Error approving fix:", error.message);
    throw error;
  }
}

/**
 * Reject a fix
 */
export async function rejectFix(fixId) {
  try {
    return await convex.mutation(api.fixes.rejectFix, { fixId });
  } catch (error) {
    console.error("❌ Error rejecting fix:", error.message);
    throw error;
  }
}

/**
 * Get system status
 */
export async function getSystemStatus() {
  try {
    const errors = await getAllErrors();
    const pendingFixes = await getPendingFixes();
    const allFixes = await getAllFixes();

    const unresolvedCount = errors.filter((e) => !e.resolved).length;
    const resolvedCount = errors.filter((e) => e.resolved).length;
    const appliedFixes = allFixes.filter(
      (f) => f.status === "applied"
    ).length;

    return {
      totalErrors: errors.length,
      unresolvedErrors: unresolvedCount,
      resolvedErrors: resolvedCount,
      pendingFixes: pendingFixes.length,
      appliedFixes: appliedFixes,
    };
  } catch (error) {
    console.error("❌ Error getting system status:", error.message);
    return null;
  }
}

export { convex };
