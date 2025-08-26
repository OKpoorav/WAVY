import { RateLimiterPrisma } from "rate-limiter-flexible";
import prisma from "./db";
import { auth } from "@clerk/nextjs/server";
import { hasPremiumAccess } from "./server-utils";
const FREE_POINTS = 5;
const DURATION = 30 * 24 * 60 * 60;
const GENERATION_COST = 1;
const PRO_POINTS = 100;
export async function getUsageTracker() {
  const useageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "Usage",
    points: (await hasPremiumAccess()) ? PRO_POINTS : FREE_POINTS,
    duration: DURATION,
  });
  return useageTracker;
}

export async function consumeCredits() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  const usageTracker = await getUsageTracker();
  const result = await usageTracker.consume(userId, GENERATION_COST);
  return result;
}

export async function getUsageStatus() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }
  const usageTracker = await getUsageTracker();
  const result = await usageTracker.get(userId);
  const hasAccess = await hasPremiumAccess();

  return {
    remainingPoints: result?.remainingPoints,
    msBeforeNext: result?.msBeforeNext,
    totalHits: result?.consumedPoints,
    hasAccess,
  };
}
