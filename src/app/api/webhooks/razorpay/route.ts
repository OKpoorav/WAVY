import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!RAZORPAY_WEBHOOK_SECRET) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  // 1. Get body and signature
  const body = await req.text();
  const razorpaySignature = req.headers.get("x-razorpay-signature");

  // 2. Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return new Response("Invalid signature", { status: 400 });
  }

  // 3. Parse event
  const event = JSON.parse(body);
  const { event: eventType, payload } = event;

  try {
    if (eventType === "subscription.activated") {
      const sub = payload.subscription.entity;
      await prisma.user.update({
        where: { subscriptionId: sub.id },
        data: {
          subscriptionStatus: "ACTIVE",
          currentPeriodEnd: new Date(sub.current_end * 1000),
        },
      });
    }

    if (eventType === "subscription.charged") {
      const sub = payload.subscription.entity;
      await prisma.user.update({
        where: { subscriptionId: sub.id },
        data: {
          currentPeriodEnd: new Date(sub.current_end * 1000),
        },
      });
    }

    if (eventType === "subscription.cancelled") {
      const sub = payload.subscription.entity;
      await prisma.user.update({
        where: { subscriptionId: sub.id },
        data: { subscriptionStatus: "CANCELLED" },
      });
    }

    if (eventType === "payment.failed") {
      const payment = payload.payment.entity;
      const subId = payment.subscription_id;

      if (subId) {
        await prisma.user.update({
          where: { subscriptionId: subId },
          data: { subscriptionStatus: "PENDING" },
          // could also mark as CANCELLED if you don’t want retry grace period
        });
      }
    }
  } catch (err) {
    console.error("Webhook handling failed", err);
    return new Response("Server error", { status: 500 });
  }

  return NextResponse.json({ success: true });
}
