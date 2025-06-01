import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe secret key not found");
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    throw new Error("Stripe signature not found");
  }
  const text = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });
  const event = stripe.webhooks.constructEvent(
    text,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  console.log("Webhook event type:", event.type);
  console.log(
    "Webhook event data:",
    JSON.stringify(event.data.object, null, 2),
  );

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice & {
        subscription?: string | { id: string };
        customer?: string | { id: string };
      };

      // Se não tiver subscription no invoice, tenta pegar do customer
      let subscriptionId: string | undefined;

      if (invoice.subscription) {
        subscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;
      } else if (invoice.customer) {
        // Busca a assinatura ativa do cliente
        const subscriptions = await stripe.subscriptions.list({
          customer:
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer.id,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          subscriptionId = subscriptions.data[0].id;
        }
      }

      if (!subscriptionId) {
        console.error("No subscription found for invoice:", invoice.id);
        return NextResponse.json({
          received: true,
          error: "No subscription found for invoice",
        });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      if (!subscription) {
        console.error("Subscription not found:", subscriptionId);
        return NextResponse.json({
          received: true,
          error: "Subscription not found",
        });
      }

      const userId = subscription.metadata.userId;
      if (!userId) {
        console.error(
          "User ID not found in subscription metadata:",
          subscriptionId,
        );
        return NextResponse.json({
          received: true,
          error: "User ID not found in subscription metadata",
        });
      }

      await db
        .update(usersTable)
        .set({
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          plan: "essential",
        })
        .where(eq(usersTable.id, userId));

      console.log("Successfully updated user:", userId);
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      if (!subscription.id) {
        console.error("Subscription ID not found in event");
        return NextResponse.json({
          received: true,
          error: "Subscription ID not found",
        });
      }

      const userId = subscription.metadata.userId;
      if (!userId) {
        console.error(
          "User ID not found in subscription metadata:",
          subscription.id,
        );
        return NextResponse.json({
          received: true,
          error: "User ID not found in subscription metadata",
        });
      }

      await db
        .update(usersTable)
        .set({
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          plan: null,
        })
        .where(eq(usersTable.id, userId));

      console.log("Successfully removed subscription from user:", userId);
    }
  }
  return NextResponse.json({
    received: true,
  });
};
