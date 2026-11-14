/**
 * ============================================================================
 * STRIPE WEBHOOK HANDLER — PAYMENT & QUOTA FULFILLMENT
 * ============================================================================
 * PURPOSE:
 *   Receives signed webhook events from Stripe Checkout and fulfills purchased
 *   session capacity for either Agency workspaces or Consumer wallets in Supabase.
 *
 * KEY WORKFLOWS:
 *   1. Signature Verification: Validates the raw request payload against
 *      STRIPE_WEBHOOK_SECRET so spoofed requests are rejected with HTTP 400.
 *   2. Settlement Guard (Card vs. ACH): Listens to both 'checkout.session.completed'
 *      (instant card payments) and 'checkout.session.async_payment_succeeded'
 *      (delayed US bank / ACH transfers). Credits are ONLY granted once
 *      session.payment_status === 'paid'.
 *   3. Dual-Path Routing via session.metadata:
 *      - Agency Path (metadata.agency_id): Maps total cents paid ($4,900 / $9,900 /
 *        $24,500) to scan allocations (+30k / +100k / +250k) and calls the
 *        idempotent `process_stripe_payment` RPC.
 *      - Consumer Path (metadata.consumer_email): Verifies purchased Stripe Price IDs
 *        (with cent-amount fallback) and calls the idempotent `process_consumer_payment` RPC.
 *   4. Retry Safety: Returns HTTP 500 if a Supabase RPC call fails so Stripe
 *      automatically retries delivery without losing paid credits.
 * ============================================================================
 */

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe SDK and Supabase Service Role client (bypasses RLS for webhook writes)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-08-26.dahlia',
});
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  // Read raw text body (required by Stripe for cryptographic HMAC verification)
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  // Verify the event genuinely originated from Stripe
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle both instant card checkouts and delayed ACH bank settlements
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object as Stripe.Checkout.Session;

    // ACH checkouts fire 'checkout.session.completed' immediately with status 'unpaid'.
    // Exit with 200 OK until 'checkout.session.async_payment_succeeded' confirms 'paid'.
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ received: true, status: 'awaiting_settlement' });
    }

    // Extract routing identifiers attached during Checkout Session creation
    const agencyId = session.metadata?.agency_id;
    const consumerEmail = session.metadata?.consumer_email;

    const sessionId = session.id;
    const amountPaid = session.amount_total;

    // ==========================================
    // 1. AGENCY PAYMENT LOGIC
    // ==========================================
    if (agencyId && amountPaid && sessionId) {
      let addedScans = 0;
      // Keep null for Standard Top-Off so coalesce() in SQL preserves higher tier badges
      let newTier = null;

      // Map payment amount (in cents) to session quota and tier upgrades
      if (amountPaid === 490000) {
        addedScans = 30000;
      } else if (amountPaid === 990000) {
        addedScans = 100000;
        newTier = 'department';
      } else if (amountPaid === 2450000) {
        addedScans = 250000;
        newTier = 'enterprise';
      }

      if (addedScans > 0) {
        // Atomically record session_id, add scans, activate plan, and extend expiry +1 year
        const { data: success, error } = await supabaseAdmin.rpc('process_stripe_payment', {
          p_agency_id: agencyId,
          p_session_id: sessionId,
          p_added_scans: addedScans,
          p_new_tier: newTier,
        });

        // Return 500 on DB failure so Stripe retries; RPC idempotency prevents double-crediting
        if (error) {
          console.error('RPC Error:', error.message);
          return NextResponse.json({ error: 'Database fulfillment failed' }, { status: 500 });
        } else if (!success) {
          console.log(`Session ${sessionId} skipped duplicate.`);
        } else {
          console.log(`Added ${addedScans} scans to agency ${agencyId}`);
        }
      }
    }

    // ==========================================
    // 2. CONSUMER PAYMENT LOGIC
    // ==========================================
    else if (consumerEmail && sessionId) {
      // Fetch line items from Stripe to match the exact purchased Price ID
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);
      const purchasedPriceId = lineItems.data[0]?.price?.id;

      let addedCredits = 0;

      // Match live consumer Price IDs first, falling back to cent totals if needed
      if (purchasedPriceId === 'price_1UUIPXF94hMxkhyPbEJ8PK91') {
        addedCredits = 5;
      } else if (purchasedPriceId === 'price_1UUIPXF94hMxkhyPoASiS0Ue') {
        addedCredits = 15;
      } else if (amountPaid === 199) {
        addedCredits = 5;
      } else if (amountPaid === 499) {
        addedCredits = 15;
      }

      if (addedCredits > 0) {
        // Atomically log receipt and increment citizen_wallets.purchased_credits
        const { error } = await supabaseAdmin.rpc('process_consumer_payment', {
          p_email: consumerEmail,
          p_session_id: sessionId,
          p_added_credits: addedCredits,
        });

        // Return 500 on DB failure so Stripe retries until fulfillment succeeds
        if (error) {
          console.error('Consumer RPC Error:', error.message);
          return NextResponse.json({ error: 'Consumer fulfillment failed' }, { status: 500 });
        } else {
          console.log(`Added ${addedCredits} credits to consumer ${consumerEmail}`);
        }
      }
    }
  }

  // Acknowledge receipt to Stripe for all processed or unhandled event types
  return NextResponse.json({ received: true });
}