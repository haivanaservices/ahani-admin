import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-08-26.dahlia',
});
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Grab both potential IDs
    const agencyId = session.metadata?.agency_id;
    const consumerEmail = session.metadata?.consumer_email;
    
    const sessionId = session.id; 
    const amountPaid = session.amount_total; 

    // ==========================================
    // 1. AGENCY PAYMENT LOGIC (UNTOUCHED)
    // ==========================================
    if (agencyId && amountPaid && sessionId) {
      let addedScans = 0;
      let newTier = null; 

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
        const { data: success, error } = await supabaseAdmin.rpc('process_stripe_payment', {
          p_agency_id: agencyId,
          p_session_id: sessionId,
          p_added_scans: addedScans,
          p_new_tier: newTier
        });

        if (error) console.error('RPC Error:', error.message);
        else if (!success) console.log(`Session ${sessionId} skipped duplicate.`);
        else console.log(`Added ${addedScans} scans to agency ${agencyId}`);
      }
    } 
    
    // ==========================================
    // 2. NEW CONSUMER PAYMENT LOGIC
    // ==========================================
    else if (consumerEmail && amountPaid && sessionId) {
      let addedCredits = 0;

      // $1.99 = 199 cents
      if (amountPaid === 199) {
        addedCredits = 5;
      } 
      // $4.99 = 499 cents
      else if (amountPaid === 499) {
        addedCredits = 15;
      }

      if (addedCredits > 0) {
        // You will need to create this RPC in Supabase to add to the consumer's wallet
        const { error } = await supabaseAdmin.rpc('process_consumer_payment', {
          p_email: consumerEmail,
          p_session_id: sessionId,
          p_added_credits: addedCredits
        });

        if (error) {
          console.error('Consumer RPC Error:', error.message);
        } else {
          console.log(`Added ${addedCredits} credits to consumer ${consumerEmail}`);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}