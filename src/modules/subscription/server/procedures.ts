import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import Razorpay from "razorpay";
import prisma from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { SubscriptionStatus } from "@/generated/prisma";
import { z } from "zod";
import crypto from "crypto";
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export const subscriptionRouter = createTRPCRouter({
  verify: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string().min(1),
        paymentId: z.string().min(1),
        signature: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;

      // Fetch user and subscription details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionId: true, subscriptionStatus: true },
      });

      if (!user || user.subscriptionId !== input.subscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid subscription",
        });
      }

      // Verify signature using Razorpay's expected format (paymentId|subscriptionId)
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(input.paymentId + "|" + input.subscriptionId)
        .digest("hex");

      if (generatedSignature !== input.signature) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid signature",
        });
      }

      // Update subscription status in Razorpay if needed, then in Prisma
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: SubscriptionStatus.ACTIVE },
      });

      return { success: true };
    }),

  create: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.auth.userId;

    // Check if user already has an active or pending subscription
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionId: true, subscriptionStatus: true },
    });

    if (!existingUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    if (
      existingUser.subscriptionId &&
      (existingUser.subscriptionStatus === SubscriptionStatus.ACTIVE ||
        existingUser.subscriptionStatus === SubscriptionStatus.PENDING)
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User already has an active or pending subscription",
      });
    }

    try {
      // Create Razorpay subscription
      const sub = await razorpay.subscriptions.create({
        plan_id: process.env.RAZORPAY_PRO_PLAN_ID!,
        total_count: 12, // e.g., 12 months
        customer_notify: 1, // send invoice email to customer
        notes: { clerkUserId: userId }, // helps with debugging
      });

      // Update user in Prisma
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionId: sub.id,
          subscriptionStatus: SubscriptionStatus.PENDING, // Use enum for type safety
        },
      });

      return sub; // Return the subscription object for frontend use (e.g., to handle payment)
    } catch (error) {
      console.error("Razorpay subscription creation failed:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create subscription",
      });
    }
  }),
});
