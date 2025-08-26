import { Webhook } from "svix";
import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { SubscriptionStatus } from "@/generated/prisma";
export async function POST(req: Request) {
  console.log(SubscriptionStatus);

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return new Response("Missing Clerk webhook secret", { status: 500 });
  }

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id")!,
    "svix-timestamp": req.headers.get("svix-timestamp")!,
    "svix-signature": req.headers.get("svix-signature")!,
  };

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(payload, headers) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = evt;

  switch (type) {
    case "user.created":
      await prisma.user.upsert({
        where: { id: data.id },
        update: { email: data.email_addresses[0]?.email_address },
        create: {
          id: data.id,
          email: data.email_addresses?.[0]?.email_address ?? null,
        },
      });
      break;

    case "user.updated":
      await prisma.user.update({
        where: { id: data.id },
        data: {
          email: data.email_addresses?.[0]?.email_address ?? null,
        },
      });
      break;

    case "user.deleted":
      await prisma.user.delete({
        where: { id: data.id },
      });
      break;

    default:
      console.log(`Unhandled event type: ${type}`);
  }

  return NextResponse.json({ success: true });
}
