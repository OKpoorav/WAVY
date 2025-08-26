import { auth } from "@clerk/nextjs/server";
import prisma from "./db";

export const hasPremiumAccess = async () => {
  const userId = (await auth()).userId!;

  const premiumAccess = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      currentPeriodEnd: true,
    },
  });

  return (
    premiumAccess?.subscriptionStatus === "ACTIVE" &&
    premiumAccess.currentPeriodEnd !== null &&
    premiumAccess.currentPeriodEnd >= new Date()
  );
};
